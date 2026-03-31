<?php
/**
 * ============================================================
 * EXAM SCHEDULES API
 * ============================================================
 *
 * GET    /schedules.php      → List all exam schedules
 * POST   /schedules.php      → Create exam schedule (Admin)
 * PUT    /schedules.php      → Update exam schedule (Admin)
 * DELETE /schedules.php?id=X → Delete exam schedule (Admin)
 *
 * Security applied:
 *  - All string inputs sanitized (trim + htmlspecialchars)
 *  - exam_date validated as real calendar date, not in the past
 *  - start_time / end_time validated as HH:MM; end must be after start
 *  - department validated against allowed enum
 *  - status validated against allowed enum on update
 *  - Integer fields (total_students, duties_required) validated for range
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

// ── GET ALL SCHEDULES ─────────────────────────────────────────
if ($method === 'GET') {

    // No user-supplied data used — safe direct query
    $result = $db->query(
        'SELECT es.*, COUNT(da.id) as allocated_duties
         FROM exam_schedules es
         LEFT JOIN duty_allocations da ON da.exam_id = es.id
         GROUP BY es.id
         ORDER BY es.exam_date, es.start_time'
    );
    respond($result->fetch_all(MYSQLI_ASSOC));
}

// ── CREATE EXAM SCHEDULE ──────────────────────────────────────
elseif ($method === 'POST') {

    requireAdmin();
    $body = getBody();

    // ── SANITIZE ──────────────────────────────────────────────
    $subject_name = sanitizeStr($body['subject_name'] ?? '', 150);
    $subject_code = sanitizeStr($body['subject_code'] ?? '', 30);
    $department   = sanitizeStr($body['department']   ?? '', 100);
    $exam_date    = sanitizeStr($body['exam_date']    ?? '', 10);
    $start_time   = sanitizeStr($body['start_time']   ?? '', 8);
    $end_time     = sanitizeStr($body['end_time']     ?? '', 8);
    $venue        = sanitizeStr($body['venue']        ?? '', 100);

    $total_students  = sanitizeInt($body['total_students']  ?? 0, 0, 9999);
    $duties_required = sanitizeInt($body['duties_required'] ?? 2, 1, 50);

    // ── VALIDATE required fields ──────────────────────────────
    if ($subject_name === '' || !validateLength($subject_name, 2, 150)) {
        respondError('subject_name is required (2–150 characters)');
    }
    if ($subject_code === '') {
        respondError('subject_code is required');
    }
    if ($department === '' || !validateEnum($department, VALID_DEPARTMENTS)) {
        respondError('Invalid department. Allowed: ' . implode(', ', VALID_DEPARTMENTS));
    }
    if ($exam_date === '' || !validateDate($exam_date)) {
        respondError('exam_date must be a valid date in YYYY-MM-DD format');
    }
    if ($exam_date < date('Y-m-d')) {
        respondError('exam_date cannot be in the past');
    }
    if ($start_time === '' || !validateTime($start_time)) {
        respondError('start_time must be in HH:MM format');
    }
    if ($end_time === '' || !validateTime($end_time)) {
        respondError('end_time must be in HH:MM format');
    }
    if ($end_time <= $start_time) {
        respondError('end_time must be after start_time');
    }
    if ($venue === '' || !validateLength($venue, 1, 100)) {
        respondError('venue is required (max 100 characters)');
    }
    if ($duties_required < 1) {
        respondError('duties_required must be at least 1');
    }

    $stmt = $db->prepare(
        'INSERT INTO exam_schedules
            (subject_name, subject_code, department, exam_date, start_time, end_time, venue, total_students, duties_required)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param(
        'sssssssii',
        $subject_name, $subject_code, $department,
        $exam_date, $start_time, $end_time,
        $venue, $total_students, $duties_required
    );
    $stmt->execute();
    respond(['message' => 'Schedule created', 'id' => $db->insert_id], 201);
}

// ── UPDATE EXAM SCHEDULE ──────────────────────────────────────
elseif ($method === 'PUT') {

    requireAdmin();
    $body = getBody();

    if (!validatePositiveInt($body['id'] ?? 0)) {
        respondError('Valid schedule ID is required');
    }
    $id = sanitizeInt($body['id'], 1);

    // ── SANITIZE ──────────────────────────────────────────────
    $subject_name = sanitizeStr($body['subject_name'] ?? '', 150);
    $subject_code = sanitizeStr($body['subject_code'] ?? '', 30);
    $department   = sanitizeStr($body['department']   ?? '', 100);
    $exam_date    = sanitizeStr($body['exam_date']    ?? '', 10);
    $start_time   = sanitizeStr($body['start_time']   ?? '', 8);
    $end_time     = sanitizeStr($body['end_time']     ?? '', 8);
    $venue        = sanitizeStr($body['venue']        ?? '', 100);
    $status       = sanitizeStr($body['status']       ?? '', 20);

    $total_students  = sanitizeInt($body['total_students']  ?? 0, 0, 9999);
    $duties_required = sanitizeInt($body['duties_required'] ?? 2, 1, 50);

    // ── VALIDATE ──────────────────────────────────────────────
    if ($subject_name === '' || !validateLength($subject_name, 2, 150)) {
        respondError('subject_name is required (2–150 characters)');
    }
    if ($subject_code === '') {
        respondError('subject_code is required');
    }
    if ($department === '' || !validateEnum($department, VALID_DEPARTMENTS)) {
        respondError('Invalid department. Allowed: ' . implode(', ', VALID_DEPARTMENTS));
    }
    if ($exam_date === '' || !validateDate($exam_date)) {
        respondError('exam_date must be a valid date in YYYY-MM-DD format');
    }
    if ($start_time === '' || !validateTime($start_time)) {
        respondError('start_time must be in HH:MM format');
    }
    if ($end_time === '' || !validateTime($end_time)) {
        respondError('end_time must be in HH:MM format');
    }
    if ($end_time <= $start_time) {
        respondError('end_time must be after start_time');
    }
    if ($venue === '' || !validateLength($venue, 1, 100)) {
        respondError('venue is required (max 100 characters)');
    }
    if ($status === '' || !validateEnum($status, VALID_EXAM_STATUSES)) {
        respondError('Invalid status. Allowed: ' . implode(', ', VALID_EXAM_STATUSES));
    }

    $stmt = $db->prepare(
        'UPDATE exam_schedules
         SET subject_name=?, subject_code=?, department=?, exam_date=?,
             start_time=?, end_time=?, venue=?, total_students=?, duties_required=?, status=?
         WHERE id=?'
    );
    $stmt->bind_param(
        'sssssssiiis',
        $subject_name, $subject_code, $department,
        $exam_date, $start_time, $end_time,
        $venue, $total_students, $duties_required,
        $status, $id
    );
    $stmt->execute();

    if ($db->affected_rows === 0) {
        respondError('Schedule not found or no changes made', 404);
    }

    respond(['message' => 'Schedule updated successfully']);
}

// ── DELETE EXAM SCHEDULE ──────────────────────────────────────
elseif ($method === 'DELETE') {

    requireAdmin();

    if (!validatePositiveInt($_GET['id'] ?? 0)) {
        respondError('Valid schedule ID is required');
    }
    $id = sanitizeInt($_GET['id'], 1);

    $stmt = $db->prepare('DELETE FROM exam_schedules WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();

    if ($db->affected_rows === 0) {
        respondError('Schedule not found', 404);
    }

    respond(['message' => 'Schedule deleted successfully']);
}

else {
    respondError('Method not allowed', 405);
}
