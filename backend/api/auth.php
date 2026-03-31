<?php
/**
 * ============================================================
 * AUTHENTICATION API
 * ============================================================
 *
 * POST /auth.php?action=login           → Login (rate-limited)
 * POST /auth.php?action=logout          → Logout (delete token)
 * GET  /auth.php?action=me             → Get current user
 * POST /auth.php?action=change_password → Change password
 *
 * Security applied:
 *  - Rate limiting on login: max 5 attempts per IP per 60 seconds
 *  - Email format validation (RFC 5321)
 *  - Password length validation (1–72 chars; bcrypt truncates at 72)
 *  - All string inputs sanitized before use
 *  - All DB queries use prepared statements (parameterised)
 *
 * @author  Chirag Yadav
 * @project Automated Examination Duty Allocation System
 * ============================================================
 */

require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../config/validation.php';
require_once '../config/email.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = sanitizeStr($_GET['action'] ?? '', 30);

/**
 * Ensure the password_resets table exists.
 */
function ensurePasswordResetsTable($db): void {
    $db->query("CREATE TABLE IF NOT EXISTS password_resets (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        email      VARCHAR(150) NOT NULL,
        otp        VARCHAR(6)   NOT NULL,
        expires_at DATETIME     NOT NULL,
        used       TINYINT(1)   DEFAULT 0,
        created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
    )");
}

/**
 * Send a password-reset OTP email via PHPMailer.
 */
function sendPasswordResetEmail(string $toEmail, string $toName, string $otp): bool {
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = MAIL_ENCRYPTION;
        $mail->Port       = MAIL_PORT;

        $mail->setFrom(MAIL_USERNAME, MAIL_FROM_NAME);
        $mail->addAddress($toEmail, $toName);

        $mail->isHTML(true);
        $mail->Subject = 'Password Reset OTP — Exam Duty System';
        $mail->Body    = "
<!DOCTYPE html>
<html lang='en'>
<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#f0f4f8;padding:30px 0;'>
    <tr><td align='center'>
      <table width='560' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);'>
        <tr>
          <td style='background:linear-gradient(135deg,#1e3a5f 0%,#2d6a9f 100%);padding:28px 40px;text-align:center;'>
            <h1 style='color:#fff;margin:0;font-size:20px;letter-spacing:1px;'>🔐 EXAM DUTY SYSTEM</h1>
            <p style='color:#a8d8f0;margin:6px 0 0;font-size:13px;'>Password Reset Request</p>
          </td>
        </tr>
        <tr>
          <td style='padding:32px 40px 10px;'>
            <h2 style='color:#1e3a5f;margin:0 0 10px;font-size:18px;'>Hello, {$toName}!</h2>
            <p style='color:#555;margin:0;font-size:15px;line-height:1.6;'>
              We received a request to reset your password. Use the OTP below to complete the process.
              This OTP is valid for <strong>15 minutes</strong>.
            </p>
          </td>
        </tr>
        <tr>
          <td style='padding:24px 40px;text-align:center;'>
            <div style='display:inline-block;background:#f0f7ff;border:2px dashed #2d6a9f;border-radius:12px;padding:20px 48px;'>
              <p style='margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:1.5px;font-weight:bold;'>Your OTP</p>
              <p style='margin:0;font-size:42px;font-weight:800;color:#1e3a5f;letter-spacing:10px;'>{$otp}</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style='padding:0 40px 30px;'>
            <div style='background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:14px 18px;'>
              <p style='margin:0;color:#795548;font-size:13px;line-height:1.6;'>
                ⚠️ <strong>Important:</strong> Do not share this OTP with anyone. If you did not request a password reset, ignore this email — your account remains secure.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style='background:#f7fafd;padding:18px 40px;text-align:center;border-top:1px solid #dde6ef;'>
            <p style='margin:0;color:#aaa;font-size:12px;'>This is an automated email. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>";
        $mail->AltBody = "Hello {$toName},\n\nYour password reset OTP is: {$otp}\n\nThis OTP expires in 15 minutes.\nIf you did not request this, ignore this email.\n\n— Exam Duty System";
        $mail->send();
        return true;
    } catch (\Exception $e) {
        error_log("Password reset email failed to {$toEmail}: " . $mail->ErrorInfo);
        return false;
    }
}

/**
 * Ensure the auth_tokens table exists (safety check on every request).
 */
function ensureTokenTable($db): void {
    $db->query("CREATE TABLE IF NOT EXISTS auth_tokens (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        user_id    INT NOT NULL,
        token      VARCHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
}

// ── LOGIN ─────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'login') {

    // ── RATE LIMIT: max 5 login attempts per IP per minute ────
    checkRateLimit('login', 5, 60);

    $body = getBody();

    // ── SANITIZE ──────────────────────────────────────────────
    $email    = sanitizeStr($body['email']    ?? '', 150);
    $password = trim($body['password']        ?? '');   // do NOT htmlspecialchars passwords

    // ── VALIDATE ──────────────────────────────────────────────
    if ($email === '' || $password === '') {
        respondError('Email and password are required');
    }
    if (!validateEmail($email)) {
        respondError('Invalid email format');
    }
    // bcrypt silently truncates at 72 bytes; anything longer is a red flag
    if (!validateLength($password, 1, 72)) {
        respondError('Password must be between 1 and 72 characters');
    }

    $db = getDB();
    ensureTokenTable($db);

    // Lookup user — prepared statement prevents SQL injection
    $stmt = $db->prepare(
        'SELECT u.*, fp.id as faculty_profile_id, fp.department, fp.employee_id
         FROM users u
         LEFT JOIN faculty_profiles fp ON fp.user_id = u.id
         WHERE u.email = ? AND u.is_active = 1'
    );
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    // Use constant-time comparison to prevent timing attacks
    if (!$user || !password_verify($password, $user['password'])) {
        respondError('Invalid email or password', 401);
    }

    // ── SUCCESS: clear rate-limit counter ────────────────────
    clearRateLimit('login');

    // Generate cryptographically secure 64-char token
    $token   = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+7 days'));

    // One active session per user
    $stmt = $db->prepare('DELETE FROM auth_tokens WHERE user_id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();

    $stmt = $db->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
    $stmt->bind_param('iss', $user['id'], $token, $expires);
    $stmt->execute();

    respond([
        'id'                 => $user['id'],
        'name'               => $user['name'],
        'email'              => $user['email'],
        'role'               => $user['role'],
        'department'         => $user['department'],
        'employee_id'        => $user['employee_id'],
        'faculty_profile_id' => $user['faculty_profile_id'],
        'token'              => $token,
    ]);
}

// ── LOGOUT ────────────────────────────────────────────────────
elseif ($method === 'POST' && $action === 'logout') {
    $db = getDB();
    ensureTokenTable($db);
    $token = getAuthToken();
    if ($token) {
        $stmt = $db->prepare('DELETE FROM auth_tokens WHERE token = ?');
        $stmt->bind_param('s', $token);
        $stmt->execute();
    }
    respond(['message' => 'Logged out successfully']);
}

// ── GET CURRENT USER ──────────────────────────────────────────
elseif ($method === 'GET' && $action === 'me') {
    $db = getDB();
    ensureTokenTable($db);
    $user = requireAuth();
    respond($user);
}

// ── CHANGE PASSWORD ───────────────────────────────────────────
elseif ($method === 'POST' && $action === 'change_password') {

    $db = getDB();
    ensureTokenTable($db);
    $user = requireAuth();

    $body = getBody();

    // Passwords must NOT be htmlspecialchars-encoded — compare raw
    $oldPassword = trim($body['old_password'] ?? '');
    $newPassword = trim($body['new_password'] ?? '');

    // ── VALIDATE ──────────────────────────────────────────────
    if ($oldPassword === '' || $newPassword === '') {
        respondError('Old password and new password are required');
    }
    if (!validateLength($newPassword, 6, 72)) {
        respondError('New password must be between 6 and 72 characters');
    }
    // Prevent trivially guessable passwords
    if (strtolower($newPassword) === 'password' ||
        strtolower($newPassword) === 'password123') {
        respondError('That password is too common. Please choose a stronger one.');
    }

    // Fetch current hash
    $stmt = $db->prepare('SELECT password FROM users WHERE id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row || !password_verify($oldPassword, $row['password'])) {
        respondError('Current password is incorrect', 401);
    }
    if (password_verify($newPassword, $row['password'])) {
        respondError('New password must be different from the current password');
    }

    // Hash and save
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt = $db->prepare('UPDATE users SET password = ? WHERE id = ?');
    $stmt->bind_param('si', $newHash, $user['id']);
    $stmt->execute();

    // Invalidate all sessions
    $stmt = $db->prepare('DELETE FROM auth_tokens WHERE user_id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();

    respond(['message' => 'Password changed successfully. Please log in again.']);
}

// ── FORGOT PASSWORD (send OTP) ────────────────────────────────
elseif ($method === 'POST' && $action === 'forgot_password') {

    // Rate-limit: max 5 OTP requests per IP per 10 minutes
    checkRateLimit('forgot_password', 5, 600);

    $body  = getBody();
    $email = sanitizeStr($body['email'] ?? '', 150);

    if ($email === '') {
        respondError('Email address is required');
    }
    if (!validateEmail($email)) {
        respondError('Invalid email format');
    }

    $db = getDB();
    ensurePasswordResetsTable($db);

    // Look up user — we proceed silently even if not found to avoid
    // leaking whether an account exists.
    $stmt = $db->prepare('SELECT id, name FROM users WHERE email = ? AND is_active = 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if ($user) {
        // Generate cryptographically secure 6-digit OTP
        $otp     = sprintf('%06d', random_int(0, 999999));
        $expires = date('Y-m-d H:i:s', strtotime('+15 minutes'));

        // Remove any existing unused OTPs for this email
        $stmt = $db->prepare('DELETE FROM password_resets WHERE email = ?');
        $stmt->bind_param('s', $email);
        $stmt->execute();

        // Store new OTP
        $stmt = $db->prepare('INSERT INTO password_resets (email, otp, expires_at) VALUES (?, ?, ?)');
        $stmt->bind_param('sss', $email, $otp, $expires);
        $stmt->execute();

        // Send OTP email (failure is logged but does not expose an error to the client)
        sendPasswordResetEmail($email, $user['name'], $otp);
    }

    // Always return the same response regardless of whether the account exists
    respond(['message' => 'If that email is registered, an OTP has been sent to it.']);
}

// ── RESET PASSWORD (verify OTP + set new password) ────────────
elseif ($method === 'POST' && $action === 'reset_password') {

    $body        = getBody();
    $email       = sanitizeStr($body['email']        ?? '', 150);
    $otp         = sanitizeStr($body['otp']          ?? '', 6);
    $newPassword = trim($body['new_password']        ?? '');

    // ── VALIDATE ──────────────────────────────────────────────
    if ($email === '' || $otp === '' || $newPassword === '') {
        respondError('Email, OTP, and new password are required');
    }
    if (!validateEmail($email)) {
        respondError('Invalid email format');
    }
    if (!preg_match('/^\d{6}$/', $otp)) {
        respondError('OTP must be a 6-digit number');
    }
    if (!validateLength($newPassword, 6, 72)) {
        respondError('New password must be between 6 and 72 characters');
    }
    if (strtolower($newPassword) === 'password' || strtolower($newPassword) === 'password123') {
        respondError('That password is too common. Please choose a stronger one.');
    }

    $db = getDB();
    ensurePasswordResetsTable($db);

    // Verify the OTP is valid, not expired, and not already used
    $stmt = $db->prepare(
        'SELECT id FROM password_resets
         WHERE email = ? AND otp = ? AND used = 0 AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1'
    );
    $stmt->bind_param('ss', $email, $otp);
    $stmt->execute();
    $reset = $stmt->get_result()->fetch_assoc();

    if (!$reset) {
        respondError('Invalid or expired OTP. Please request a new one.', 400);
    }

    // Verify the user still exists
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND is_active = 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user) {
        respondError('Account not found', 404);
    }

    // Hash and save the new password
    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt = $db->prepare('UPDATE users SET password = ? WHERE id = ?');
    $stmt->bind_param('si', $newHash, $user['id']);
    $stmt->execute();

    // Mark OTP as used so it cannot be replayed
    $stmt = $db->prepare('UPDATE password_resets SET used = 1 WHERE id = ?');
    $stmt->bind_param('i', $reset['id']);
    $stmt->execute();

    // Invalidate all active sessions for this user
    ensureTokenTable($db);
    $stmt = $db->prepare('DELETE FROM auth_tokens WHERE user_id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();

    respond(['message' => 'Password reset successfully. Please log in with your new password.']);
}

// ── INVALID REQUEST ───────────────────────────────────────────
else {
    respondError('Invalid request. Use ?action=login, logout, me, change_password, forgot_password, or reset_password', 404);
}
