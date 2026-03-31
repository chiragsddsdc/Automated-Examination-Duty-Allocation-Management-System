<?php
/**
 * ============================================================
 * FACULTY AVAILABILITY API
 * ============================================================
 *
 * GET    /availability.php?faculty_id=X → Get unavailable dates
 * POST   /availability.php              → Save unavailability slots
 * DELETE /availability.php?id=X         → Remove a slot
 *
 * Security applied:
 *  - All string inputs sanitized (trim + htmlspecialchars)
 *  - faculty_id validated as positive integer
 *  - Authorization check: faculty may only set their OWN availability
 *  - Each slot's date and time values fully validated
 *  - reason length capped at 255 characters
 *  - is_available validated as 0 or 1
 *  - All DB queries use prepared statements
 *
 * @author  Chirag Yadav
 * @project Automated Examination Duty Allocation System
 * ============================================================
 */

require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../config/validation.php';

$user   = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ── GET AVAILABILITY ──────────────────────────────────────────
if ($method === 'GET') {

    if (!empty($_GET['faculty_id'])) {

        if (!validatePositiveInt($_GET['faculty_id'])) {
            respondError('Invalid faculty_id');
        }
        $faculty_id = sanitizeInt($_GET['faculty_id'], 1);

        $stmt = $db->prepare(
            'SELECT * FROM availability
             WHERE faculty_id = ?
             ORDER BY available_date, start_time'
        );
        $stmt->bind_param('i', $faculty_id);
        $stmt->execute();
        respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));

    } else {
        // Admin: get all availability records with faculty name
        requireAdmin();
        $result = $db->query(
            'SELECT a.*, u.name as faculty_name
             FROM availability a
             JOIN faculty_profiles fp ON fp.id = a.faculty_id
             JOIN users u ON u.id = fp.user_id
             ORDER BY a.available_date'
        );
        respond($result->fetch_all(MYSQLI_ASSOC));
    }
}

// ── SAVE AVAILABILITY SLOTS ───────────────────────────────────
elseif ($method === 'POST') {

    $body = getBody();

    // ── VALIDATE faculty_id ───────────────────────────────────
    if (!validatePositiveInt($body['faculty_id'] ?? 0)) {
        respondError('Valid faculty_id is required');
    }
    $faculty_id = sanitizeInt($body['faculty_id'], 1);

    // ── AUTHORIZATION: faculty can only set their OWN availability ──
    if ($user['role'] === 'faculty') {
        // Resolve the logged-in user's faculty profile ID
        $stmt = $db->prepare('SELECT id FROM faculty_profiles WHERE user_id = ?');
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
        $profile = $stmt->get_result()->fetch_assoc();
        if (!$profile || $profile['id'] !== $faculty_id) {
            respondError('Forbidden — you may only set your own availability', 403);
        }
    }

    // ── VALIDATE slots array ──────────────────────────────────
    $slots = $body['slots'] ?? [];
    if (!is_array($slots) || empty($slots)) {
        respondError('slots must be a non-empty array');
    }
    if (count($slots) > 100) {
        respondError('Too many slots in one request (max 100)');
    }

    $stmt = $db->prepare(
        'INSERT INTO availability
            (faculty_id, available_date, start_time, end_time, is_available, reason)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            is_available = VALUES(is_available),
            reason       = VALUES(reason)'
    );

    $inserted = 0;
    $rowErrors = [];

    foreach ($slots as $i => $slot) {
        $rowNum = $i + 1;

        // Sanitize each slot field
        $date       = sanitizeStr($slot['date']       ?? '', 10);
        $start_time = sanitizeStr($slot['start_time'] ?? '', 8);
        $end_time   = sanitizeStr($slot['end_time']   ?? '', 8);
        $reason     = sanitizeStr($slot['reason']     ?? '', 255);
        $is_avail   = isset($slot['is_available']) ? sanitizeInt($slot['is_available'], 0, 1) : 1;

        // Validate
        if ($date === '' || !validateDate($date)) {
            $rowErrors[] = "Slot {$rowNum}: invalid date '{$date}' — use YYYY-MM-DD";
            continue;
        }
        if ($start_time === '' || !validateTime($start_time)) {
            $rowErrors[] = "Slot {$rowNum}: invalid start_time '{$start_time}' — use HH:MM";
            continue;
        }
        if ($end_time === '' || !validateTime($end_time)) {
            $rowErrors[] = "Slot {$rowNum}: invalid end_time '{$end_time}' — use HH:MM";
            continue;
        }
        if ($end_time <= $start_time) {
            $rowErrors[] = "Slot {$rowNum}: end_time must be after start_time";
            continue;
        }

        $stmt->bind_param('isssss', $faculty_id, $date, $start_time, $end_time, $is_avail, $reason);
        $stmt->execute();
        $inserted++;
    }

    if (!empty($rowErrors)) {
        respond([
            'message'  => "$inserted slot(s) saved; " . count($rowErrors) . ' skipped due to errors',
            'inserted' => $inserted,
            'errors'   => $rowErrors,
        ]);
    }

    respond(['message' => 'Availability saved', 'inserted' => $inserted]);
}

// ── DELETE AVAILABILITY SLOT ──────────────────────────────────
elseif ($method === 'DELETE') {

    if (!validatePositiveInt($_GET['id'] ?? 0)) {
        respondError('Valid availability ID is required');
    }
    $id = sanitizeInt($_GET['id'], 1);

    // Faculty may only delete their own slots
    if ($user['role'] === 'faculty') {
        $stmt = $db->prepare(
            'SELECT a.id FROM availability a
             JOIN faculty_profiles fp ON fp.id = a.faculty_id
             WHERE a.id = ? AND fp.user_id = ?'
        );
        $stmt->bind_param('ii', $id, $user['id']);
        $stmt->execute();
        if (!$stmt->get_result()->fetch_assoc()) {
            respondError('Forbidden — you may only delete your own availability records', 403);
        }
    }

    $stmt = $db->prepare('DELETE FROM availability WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();

    if ($db->affected_rows === 0) {
        respondError('Availability record not found', 404);
    }

    respond(['message' => 'Availability removed']);
}

else {
    respondError('Method not allowed', 405);
}
