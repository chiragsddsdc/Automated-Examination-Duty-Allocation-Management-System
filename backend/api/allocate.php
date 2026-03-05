<?php
// backend/api/allocate.php
// ============================================================
// CORE ALLOCATION ALGORITHM
// Strategy: Weighted Round-Robin with Constraint Checking
// ============================================================
require_once '../config/cors.php';
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Allow faculty to GET allocations, but only admins can POST/PUT/DELETE
if ($method === 'GET') {
    $user = requireAuth();
} else {
    $user = requireAdmin();
}

$db = getDB();

// GET all allocations
if ($method === 'GET') {
    $exam_id = intval($_GET['exam_id'] ?? 0);
    $faculty_id = intval($_GET['faculty_id'] ?? 0);

    // If faculty is logged in, only show their own duties
    if ($user['role'] === 'faculty') {
        $stmt = $db->prepare('SELECT fp.id FROM faculty_profiles fp WHERE fp.user_id = ?');
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
        $fp = $stmt->get_result()->fetch_assoc();
        if ($fp) $faculty_id = $fp['id'];
    }

    $where = '1=1';
    $params = [];
    $types = '';

    if ($exam_id) { $where .= ' AND da.exam_id = ?'; $params[] = $exam_id; $types .= 'i'; }
    if ($faculty_id) { $where .= ' AND da.faculty_id = ?'; $params[] = $faculty_id; $types .= 'i'; }

    $stmt = $db->prepare("SELECT da.*, 
                          u.name as faculty_name, fp.department as faculty_dept, fp.employee_id,
                          es.subject_name, es.exam_date, es.start_time, es.end_time, es.venue, es.department as exam_dept,
                          dt.name as duty_type_name
                          FROM duty_allocations da
                          JOIN faculty_profiles fp ON fp.id = da.faculty_id
                          JOIN users u ON u.id = fp.user_id
                          JOIN exam_schedules es ON es.id = da.exam_id
                          JOIN duty_types dt ON dt.id = da.duty_type_id
                          WHERE $where
                          ORDER BY es.exam_date, es.start_time");
    if ($types) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
}

// POST - Run allocation algorithm
elseif ($method === 'POST') {
    $body = getBody();
    $exam_ids = $body['exam_ids'] ?? []; // specific exams, or empty = all unallocated
    $overwrite = $body['overwrite'] ?? false;

    // Fetch exams to allocate
    if (!empty($exam_ids)) {
        $placeholders = implode(',', array_fill(0, count($exam_ids), '?'));
        $stmt = $db->prepare("SELECT * FROM exam_schedules WHERE id IN ($placeholders) AND status != 'cancelled'");
        $stmt->bind_param(str_repeat('i', count($exam_ids)), ...$exam_ids);
    } else {
        $stmt = $db->prepare("SELECT * FROM exam_schedules WHERE status = 'scheduled' ORDER BY exam_date, start_time");
    }
    $stmt->execute();
    $exams = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    if (empty($exams)) respondError('No exams found to allocate');

    // Fetch all active faculty with their workload counts
    $facultyResult = $db->query("SELECT fp.id, fp.department, fp.experience_years, fp.max_duties_per_week,
                                  u.name, u.id as user_id,
                                  COUNT(da.id) as current_duties
                                  FROM faculty_profiles fp
                                  JOIN users u ON u.id = fp.user_id
                                  LEFT JOIN duty_allocations da ON da.faculty_id = fp.id
                                  WHERE u.is_active = 1
                                  GROUP BY fp.id
                                  ORDER BY current_duties ASC, fp.experience_years DESC");
    $allFaculty = $facultyResult->fetch_all(MYSQLI_ASSOC);

    if (empty($allFaculty)) respondError('No active faculty found');

    // Fetch all duty types
    $dutyTypes = $db->query('SELECT * FROM duty_types ORDER BY weight DESC')->fetch_all(MYSQLI_ASSOC);

    $allocated = [];
    $skipped = [];
    $errors = [];

    foreach ($exams as $exam) {
        // Skip if already allocated and not overwriting
        if (!$overwrite) {
            $stmt = $db->prepare('SELECT COUNT(*) as cnt FROM duty_allocations WHERE exam_id = ?');
            $stmt->bind_param('i', $exam['id']);
            $stmt->execute();
            $existing = $stmt->get_result()->fetch_assoc();
            if ($existing['cnt'] >= $exam['duties_required']) {
                $skipped[] = $exam['subject_name'];
                continue;
            }
        } else {
            // Delete existing allocations for this exam
            $stmt = $db->prepare('DELETE FROM duty_allocations WHERE exam_id = ?');
            $stmt->bind_param('i', $exam['id']);
            $stmt->execute();
        }

        $assignedCount = 0;
        $assigned_faculty_ids = [];
        $dutyTypeIndex = 0;

        // Sort faculty by workload (least duties first) - fair distribution
        usort($allFaculty, function($a, $b) {
            return $a['current_duties'] - $b['current_duties'];
        });

        foreach ($allFaculty as &$faculty) {
            if ($assignedCount >= $exam['duties_required']) break;

            // CONSTRAINT 1: Don't assign faculty to their own department's exam
            if ($faculty['department'] === $exam['department']) continue;

            // CONSTRAINT 2: Check if faculty already assigned to another exam at same time
            $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM duty_allocations da
                                  JOIN exam_schedules es ON es.id = da.exam_id
                                  WHERE da.faculty_id = ? AND es.exam_date = ?
                                  AND ((es.start_time <= ? AND es.end_time >= ?) OR (es.start_time <= ? AND es.end_time >= ?))");
            $stmt->bind_param('isssss', $faculty['id'], $exam['exam_date'], 
                              $exam['start_time'], $exam['start_time'],
                              $exam['end_time'], $exam['end_time']);
            $stmt->execute();
            $conflict = $stmt->get_result()->fetch_assoc();
            if ($conflict['cnt'] > 0) continue;

            // CONSTRAINT 3: Check max weekly duties
            $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM duty_allocations da
                                  JOIN exam_schedules es ON es.id = da.exam_id
                                  WHERE da.faculty_id = ? AND WEEK(es.exam_date) = WEEK(?)");
            $stmt->bind_param('is', $faculty['id'], $exam['exam_date']);
            $stmt->execute();
            $weeklyDuties = $stmt->get_result()->fetch_assoc();
            if ($weeklyDuties['cnt'] >= $faculty['max_duties_per_week']) continue;

            // CONSTRAINT 4: Check faculty availability (if they've marked unavailability)
            $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM availability
                                  WHERE faculty_id = ? AND available_date = ? AND is_available = 0");
            $stmt->bind_param('is', $faculty['id'], $exam['exam_date']);
            $stmt->execute();
            $unavailable = $stmt->get_result()->fetch_assoc();
            if ($unavailable['cnt'] > 0) continue;

            // All constraints passed - ASSIGN DUTY
            $dutyType = $dutyTypes[$dutyTypeIndex % count($dutyTypes)];
            $dutyTypeIndex++;

            $stmt = $db->prepare('INSERT INTO duty_allocations (exam_id, faculty_id, duty_type_id) VALUES (?, ?, ?)');
            $stmt->bind_param('iii', $exam['id'], $faculty['id'], $dutyType['id']);
            $stmt->execute();

            // Send notification
            $title = "New Duty Assigned: {$exam['subject_name']}";
            $message = "You have been assigned as {$dutyType['name']} for {$exam['subject_name']} on " . date('d M Y', strtotime($exam['exam_date'])) . " at {$exam['venue']}.";
            $stmt = $db->prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, "duty_assigned")');
            $stmt->bind_param('iss', $faculty['user_id'], $title, $message);
            $stmt->execute();

            $faculty['current_duties']++;
            $assigned_faculty_ids[] = $faculty['id'];
            $assignedCount++;
        }

        if ($assignedCount > 0) {
            $allocated[] = [
                'exam' => $exam['subject_name'],
                'date' => $exam['exam_date'],
                'assigned' => $assignedCount,
                'required' => $exam['duties_required']
            ];
        } else {
            $errors[] = "Could not allocate duties for: {$exam['subject_name']} - no eligible faculty available";
        }
    }

    respond([
        'message' => 'Allocation complete',
        'allocated' => $allocated,
        'skipped' => $skipped,
        'errors' => $errors,
        'summary' => [
            'total_exams' => count($exams),
            'successfully_allocated' => count($allocated),
            'skipped' => count($skipped),
            'failed' => count($errors)
        ]
    ]);
}

// PUT - Update allocation status
elseif ($method === 'PUT') {
    $body = getBody();
    $id = intval($body['id'] ?? 0);
    $status = $body['status'] ?? '';
    if (!$id || !$status) respondError('ID and status required');

    $stmt = $db->prepare('UPDATE duty_allocations SET status = ? WHERE id = ?');
    $stmt->bind_param('si', $status, $id);
    $stmt->execute();
    respond(['message' => 'Allocation updated']);
}

// DELETE - Remove single allocation
elseif ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) respondError('ID required');
    $stmt = $db->prepare('DELETE FROM duty_allocations WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    respond(['message' => 'Allocation removed']);
}

else {
    respondError('Method not allowed', 405);
}
