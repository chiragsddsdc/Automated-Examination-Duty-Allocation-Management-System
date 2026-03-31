<?php
/**
 * ============================================================
 * INPUT VALIDATION & SECURITY LIBRARY
 * ============================================================
 *
 * Shared helper functions used across ALL API endpoints for:
 *   - Input sanitization  (strip HTML, trim whitespace)
 *   - Type validation     (int, date, time, email, enum)
 *   - Rate limiting       (file-based, per IP, configurable)
 *
 * Every API file includes this with:
 *   require_once '../config/validation.php';
 *
 * @author  Chirag Yadav
 * @project Automated Examination Duty Allocation System
 * ============================================================
 */

// ── RATE-LIMIT STORAGE DIRECTORY ─────────────────────────────
// JSON files are written here, one per IP address (md5-hashed filename).
define('RATE_LIMIT_DIR', __DIR__ . '/rate_limit/');

// ── ALLOWED ENUMERATIONS ─────────────────────────────────────
// Single source-of-truth for every constrained string field.
define('VALID_DEPARTMENTS', [
    'Computer Science', 'Mathematics', 'Physics', 'Electronics',
    'Chemistry', 'Mechanical', 'Civil', 'Biology', 'English', 'Commerce',
]);
define('VALID_DESIGNATIONS', [
    'Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Dean',
]);
define('VALID_EXAM_STATUSES', ['scheduled', 'ongoing', 'completed', 'cancelled']);
define('VALID_ALLOC_STATUSES', ['assigned', 'acknowledged', 'completed', 'absent']);


/* ============================================================
   SANITIZATION
   ============================================================ */

/**
 * Sanitize a string input.
 * Trims whitespace and converts special HTML characters to entities
 * so that <script>, SQL comment injections, etc. are neutralised
 * before the value is used in responses or stored.
 *
 * @param  mixed  $value     Raw input value
 * @param  int    $maxLength Truncate to this length (0 = no limit)
 * @return string            Clean, safe string
 */
function sanitizeStr($value, int $maxLength = 500): string {
    if ($value === null || $value === false) return '';
    $value = trim((string) $value);
    $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    if ($maxLength > 0 && mb_strlen($value, 'UTF-8') > $maxLength) {
        $value = mb_substr($value, 0, $maxLength, 'UTF-8');
    }
    return $value;
}

/**
 * Sanitize an integer input with optional min/max clamping.
 *
 * @param  mixed $value  Raw input
 * @param  int   $min    Minimum allowed value (inclusive)
 * @param  int   $max    Maximum allowed value (inclusive)
 * @return int           Safe integer
 */
function sanitizeInt($value, int $min = 0, int $max = PHP_INT_MAX): int {
    $int = intval($value);
    if ($int < $min) return $min;
    if ($int > $max) return $max;
    return $int;
}


/* ============================================================
   VALIDATION
   ============================================================ */

/**
 * Validate an email address using PHP's built-in filter.
 */
function validateEmail(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate a date string in YYYY-MM-DD format.
 * Rejects non-existent dates like 2025-02-30.
 */
function validateDate(string $date): bool {
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return false;
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d !== false && $d->format('Y-m-d') === $date;
}

/**
 * Validate a time string.  Accepts HH:MM or HH:MM:SS.
 */
function validateTime(string $time): bool {
    return preg_match('/^\d{2}:\d{2}(:\d{2})?$/', trim($time)) === 1;
}

/**
 * Validate that a value is in an allowed set (case-sensitive).
 */
function validateEnum(string $value, array $allowed): bool {
    return in_array($value, $allowed, true);
}

/**
 * Validate string length is within bounds (multi-byte aware).
 */
function validateLength(string $value, int $min, int $max): bool {
    $len = mb_strlen($value, 'UTF-8');
    return $len >= $min && $len <= $max;
}

/**
 * Validate that a value is a strictly positive integer.
 * Rejects 0, negative numbers, floats, and non-numeric strings.
 */
function validatePositiveInt($value): bool {
    if (!is_numeric($value)) return false;
    $int = intval($value);
    return $int > 0 && (string)$int === (string)intval($value);
}

/**
 * Validate an array of IDs — every element must be a positive integer.
 * Returns false on first invalid element.
 */
function validateIntArray(array $arr): bool {
    if (empty($arr)) return false;
    foreach ($arr as $v) {
        if (!validatePositiveInt($v)) return false;
    }
    return true;
}

/**
 * Validate a phone number: digits, spaces, +, -, () only; 7-15 chars.
 */
function validatePhone(string $phone): bool {
    if ($phone === '') return true; // Phone is optional — empty is OK
    return preg_match('/^[0-9\s\+\-\(\)]{7,15}$/', $phone) === 1;
}


/* ============================================================
   RATE LIMITING  (file-based, per IP)
   ============================================================ */

/**
 * Check and enforce rate limiting for the caller's IP address.
 *
 * How it works:
 *  1. Derive a filename from md5(IP)  →  no IP is stored in plaintext.
 *  2. Read or create a JSON file:     {attempts: N, window_start: timestamp}
 *  3. If the current window is older than $windowSecs, reset the counter.
 *  4. Increment the counter and persist.
 *  5. If attempts > $maxAttempts, respond with HTTP 429 and stop.
 *
 * On a SUCCESSFUL action (e.g. login) call clearRateLimit() to reset.
 *
 * @param  string $action      A string identifying the action (e.g. "login")
 * @param  int    $maxAttempts Maximum requests allowed in the window (default 5)
 * @param  int    $windowSecs  Window duration in seconds (default 60)
 * @return void
 */
function checkRateLimit(string $action, int $maxAttempts = 5, int $windowSecs = 60): void {
    // Create storage directory on first use
    if (!is_dir(RATE_LIMIT_DIR)) {
        mkdir(RATE_LIMIT_DIR, 0755, true);
    }

    // Use the real client IP, falling back safely
    $ip  = $_SERVER['HTTP_X_FORWARDED_FOR']
         ?? $_SERVER['REMOTE_ADDR']
         ?? 'unknown';
    // If X-Forwarded-For contains a comma-list, take only the first entry
    $ip  = trim(explode(',', $ip)[0]);

    $key  = md5($action . ':' . $ip);          // action-scoped key
    $file = RATE_LIMIT_DIR . $key . '.json';
    $now  = time();
    $data = ['attempts' => 0, 'window_start' => $now];

    // Read existing window data
    if (file_exists($file)) {
        $raw = @file_get_contents($file);
        if ($raw !== false) {
            $parsed = json_decode($raw, true);
            if (is_array($parsed)) $data = $parsed;
        }
    }

    // Reset if window has expired
    if (($now - (int)$data['window_start']) >= $windowSecs) {
        $data = ['attempts' => 0, 'window_start' => $now];
    }

    $data['attempts']++;
    @file_put_contents($file, json_encode($data), LOCK_EX);

    if ((int)$data['attempts'] > $maxAttempts) {
        $retryAfter = max(1, $windowSecs - ($now - (int)$data['window_start']));
        header('Retry-After: ' . $retryAfter);
        respondError(
            "Too many attempts. Please wait {$retryAfter} second(s) before trying again.",
            429
        );
    }
}

/**
 * Clear the rate-limit counter for an action/IP combination.
 * Call this on successful login so the counter resets for the next session.
 */
function clearRateLimit(string $action): void {
    if (!is_dir(RATE_LIMIT_DIR)) return;
    $ip  = $_SERVER['HTTP_X_FORWARDED_FOR']
         ?? $_SERVER['REMOTE_ADDR']
         ?? 'unknown';
    $ip  = trim(explode(',', $ip)[0]);
    $key  = md5($action . ':' . $ip);
    $file = RATE_LIMIT_DIR . $key . '.json';
    if (file_exists($file)) @unlink($file);
}
