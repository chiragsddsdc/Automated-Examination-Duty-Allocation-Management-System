<?php
/**
 * ============================================================
 * CORE DUTY ALLOCATION ALGORITHM
 * ============================================================
 * 
 * This is the most important file in the entire system.
 * It implements the automated duty allocation algorithm that
 * assigns exam duties to faculty members fairly and efficiently.
 * 
 * ALGORITHM: Weighted Round-Robin with Constraint Checking
 * ─────────────────────────────────────────────────────────
 * 
 * Step 1: Fetch all exam slots that need duties filled
 * Step 2: Fetch all active faculty sorted by workload (least first)
 * Step 3: For each exam, loop through faculty and check 4 constraints:
 *         CONSTRAINT 1 → Faculty cannot invigilate their own dept's exam
 *         CONSTRAINT 2 → No time conflicts (cannot be double-booked)
 *         CONSTRAINT 3 → Max duties per week limit respected
 *         CONSTRAINT 4 → Skip if faculty marked themselves unavailable
 * Step 4: If all constraints pass → assign duty
 * Step 5: Rotate duty types (Invigilation → Supervision → Flying Squad → Evaluation)
 * Step 6: Send notification to assigned faculty
 * Step 7: Repeat until all exam slots are filled
 * 
 * WHY WEIGHTED ROUND-ROBIN?
 * Regular round-robin assigns duties in strict rotation regardless of
 * who already has more duties. Weighted round-robin first sorts faculty
 * by current workload so the least-loaded faculty always get priority.
 * This ensures FAIR distribution across all faculty members.
 * 
 * ENDPOINTS:
 * GET    /allocate.php              → View all allocations
 * GET    /allocate.php?faculty_id=X → View specific faculty's duties
 * GET    /allocate.php?exam_id=X    → View duties for specific exam
 * POST   /allocate.php              → Run allocation algorithm (Admin only)
 * PUT    /allocate.php              → Update allocation status (Admin only)
 * DELETE /allocate.php?id=X        → Remove an allocation (Admin only)
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

// Access control:
// GET requests → any logged-in user (faculty can view their own duties)
// POST/PUT/DELETE → admin only (only admin can run/modify allocation)
if ($method === 'GET') {
    $user = requireAuth();
} else {
    $user = requireAdmin();
}

$db = getDB();

// ── GET ALLOCATIONS ───────────────────────────────────────────
if ($method === 'GET') {
    
    // Optional filters from URL parameters
    $exam_id    = intval($_GET['exam_id'] ?? 0);
    $faculty_id = intval($_GET['faculty_id'] ?? 0);

    // IMPORTANT: If faculty is viewing, automatically filter to their duties only
    // Faculty should NOT see other faculty members' duty assignments
    if ($user['role'] === 'faculty') {
        // Get faculty profile ID from user ID
        $stmt = $db->prepare('SELECT fp.id FROM faculty_profiles fp WHERE fp.user_id = ?');
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
        $fp = $stmt->get_result()->fetch_assoc();
        if ($fp) $faculty_id = $fp['id']; // Force filter to their own duties
    }

    // Build dynamic WHERE clause based on provided filters
    $where = '1=1'; // Default: no filter (get all)
    $params = [];
    $types = '';

    // Add exam filter if provided
    if ($exam_id) { 
        $where .= ' AND da.exam_id = ?'; 
        $params[] = $exam_id; 
        $types .= 'i'; 
    }
    
    // Add faculty filter if provided (or auto-set for faculty role)
    if ($faculty_id) { 
        $where .= ' AND da.faculty_id = ?'; 
        $params[] = $faculty_id; 
        $types .= 'i'; 
    }

    // Fetch allocations with all related details using JOINs
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
    
    // Bind parameters only if we have filters
    if ($types) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
}

// ── RUN ALLOCATION ALGORITHM ──────────────────────────────────
elseif ($method === 'POST') {
    
    $body     = getBody();
    $exam_ids = $body['exam_ids'] ?? [];
    $overwrite = !empty($body['overwrite']) && $body['overwrite'] !== false;

    // Validate exam_ids: must be an array of positive integers (or empty = all)
    if (!empty($exam_ids)) {
        if (!is_array($exam_ids)) {
            respondError('exam_ids must be an array of integers');
        }
        // Sanitize every element to a positive integer; reject 0/negatives
        $exam_ids = array_map('intval', $exam_ids);
        $exam_ids = array_filter($exam_ids, fn($id) => $id > 0);
        if (empty($exam_ids)) {
            respondError('exam_ids contains no valid positive integer IDs');
        }
        $exam_ids = array_values($exam_ids); // re-index after filter
    }

    // ── STEP 1: Fetch exams to process ──────────────────────
    if (!empty($exam_ids)) {
        // Allocate only the selected exams
        $placeholders = implode(',', array_fill(0, count($exam_ids), '?'));
        $stmt = $db->prepare("SELECT * FROM exam_schedules WHERE id IN ($placeholders) AND status != 'cancelled'");
        $stmt->bind_param(str_repeat('i', count($exam_ids)), ...$exam_ids);
    } else {
        // Allocate ALL scheduled exams that haven't been cancelled
        $stmt = $db->prepare("SELECT * FROM exam_schedules WHERE status = 'scheduled' ORDER BY exam_date, start_time");
    }
    $stmt->execute();
    $exams = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    if (empty($exams)) respondError('No exams found to allocate');

    // ── STEP 2: Fetch all active faculty with workload data ──
    // Sort by current_duties ASC so least-loaded faculty come first
    // This is the "weighted" part of Weighted Round-Robin
    $facultyResult = $db->query("SELECT fp.id, fp.department, fp.experience_years, fp.max_duties_per_week,
                                  u.name, u.id as user_id, u.email,
                                  COUNT(da.id) as current_duties
                                  FROM faculty_profiles fp
                                  JOIN users u ON u.id = fp.user_id
                                  LEFT JOIN duty_allocations da ON da.faculty_id = fp.id
                                  WHERE u.is_active = 1
                                  GROUP BY fp.id
                                  ORDER BY current_duties ASC, fp.experience_years DESC");
    $allFaculty = $facultyResult->fetch_all(MYSQLI_ASSOC);

    if (empty($allFaculty)) respondError('No active faculty found');

    // Fetch duty types (Invigilation, Supervision, Flying Squad, Evaluation)
    $dutyTypes = $db->query('SELECT * FROM duty_types ORDER BY weight DESC')->fetch_all(MYSQLI_ASSOC);

    // Track results for the response
    $allocated = []; // Successfully allocated exams
    $skipped   = []; // Skipped (already allocated and overwrite=false)
    $errors    = []; // Failed allocations (not enough eligible faculty)

    // ── STEP 3: Process each exam ────────────────────────────
    foreach ($exams as $exam) {
        
        // Check if exam already has enough duties allocated
        if (!$overwrite) {
            $stmt = $db->prepare('SELECT COUNT(*) as cnt FROM duty_allocations WHERE exam_id = ?');
            $stmt->bind_param('i', $exam['id']);
            $stmt->execute();
            $existing = $stmt->get_result()->fetch_assoc();
            
            // Skip this exam if already fully allocated
            if ($existing['cnt'] >= $exam['duties_required']) {
                $skipped[] = $exam['subject_name'];
                continue; // Move to next exam
            }
        } else {
            // Overwrite mode: delete all existing allocations for this exam first
            $stmt = $db->prepare('DELETE FROM duty_allocations WHERE exam_id = ?');
            $stmt->bind_param('i', $exam['id']);
            $stmt->execute();
        }

        $assignedCount    = 0;  // How many duties assigned for this exam so far
        $dutyTypeIndex    = 0;  // Index to rotate through duty types

        // Re-sort faculty by workload before each exam for fairness
        usort($allFaculty, function($a, $b) {
            return $a['current_duties'] - $b['current_duties'];
        });

        // ── STEP 4: Try to assign each required duty ─────────
        foreach ($allFaculty as &$faculty) {
            
            // Stop if we've filled all required duties for this exam
            if ($assignedCount >= $exam['duties_required']) break;

            // ── CONSTRAINT 1: Department Check ────────────────
            // Faculty cannot invigilate their own department's exam
            // Reason: They may know students personally, creating bias
            if ($faculty['department'] === $exam['department']) continue;

            // ── CONSTRAINT 2: Time Conflict Check ─────────────
            // Faculty cannot be assigned two duties at the same time
            // Checks if faculty already has a duty that overlaps with this exam's time
            $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM duty_allocations da
                                  JOIN exam_schedules es ON es.id = da.exam_id
                                  WHERE da.faculty_id = ? AND es.exam_date = ?
                                  AND ((es.start_time <= ? AND es.end_time >= ?) 
                                  OR (es.start_time <= ? AND es.end_time >= ?))");
            $stmt->bind_param('isssss', 
                $faculty['id'], $exam['exam_date'], 
                $exam['start_time'], $exam['start_time'],
                $exam['end_time'], $exam['end_time']
            );
            $stmt->execute();
            $conflict = $stmt->get_result()->fetch_assoc();
            if ($conflict['cnt'] > 0) continue; // Skip: time conflict

            // ── CONSTRAINT 3: Weekly Duty Limit Check ─────────
            // Faculty cannot exceed their maximum duties per week
            // Each faculty member has a configurable max (usually 5/week)
            $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM duty_allocations da
                                  JOIN exam_schedules es ON es.id = da.exam_id
                                  WHERE da.faculty_id = ? AND WEEK(es.exam_date) = WEEK(?)");
            $stmt->bind_param('is', $faculty['id'], $exam['exam_date']);
            $stmt->execute();
            $weeklyDuties = $stmt->get_result()->fetch_assoc();
            if ($weeklyDuties['cnt'] >= $faculty['max_duties_per_week']) continue; // Skip: limit reached

            // ── CONSTRAINT 4: Availability Check ──────────────
            // Skip faculty who have marked themselves as unavailable on this date
            // Faculty can mark unavailable dates from their portal
            $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM availability
                                  WHERE faculty_id = ? AND available_date = ? AND is_available = 0");
            $stmt->bind_param('is', $faculty['id'], $exam['exam_date']);
            $stmt->execute();
            $unavailable = $stmt->get_result()->fetch_assoc();
            if ($unavailable['cnt'] > 0) continue; // Skip: marked unavailable

            // ── ALL CONSTRAINTS PASSED → ASSIGN DUTY ──────────
            // Rotate through duty types using modulo operator
            // e.g., index 0→Invigilation, 1→Supervision, 2→Flying Squad, 3→Evaluation, 4→Invigilation...
            $dutyType = $dutyTypes[$dutyTypeIndex % count($dutyTypes)];
            $dutyTypeIndex++;

            // Insert allocation record into database
            $stmt = $db->prepare('INSERT INTO duty_allocations (exam_id, faculty_id, duty_type_id) VALUES (?, ?, ?)');
            $stmt->bind_param('iii', $exam['id'], $faculty['id'], $dutyType['id']);
            $stmt->execute();

            // ── STEP 5: Send in-app notification to assigned faculty ──
            $title = "New Duty Assigned: {$exam['subject_name']}";
            $message = "You have been assigned as {$dutyType['name']} for {$exam['subject_name']} on "
                     . date('d M Y', strtotime($exam['exam_date']))
                     . " at {$exam['venue']}.";

            $stmt = $db->prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, "duty_assigned")');
            $stmt->bind_param('iss', $faculty['user_id'], $title, $message);
            $stmt->execute();

            // ── STEP 5b: Send duty assignment email to faculty ─
            // Runs after DB insert so a failed email never blocks allocation
            sendDutyAssignmentEmail(
                $faculty['email'],
                $faculty['name'],
                $exam['subject_name'],
                $exam['exam_date'],
                $exam['start_time'],
                $exam['end_time'],
                $exam['venue'],
                $dutyType['name']
            );

            // Update faculty's duty count in memory (so next iteration is accurate)
            $faculty['current_duties']++;
            $assignedCount++;
        }

        // Track result for this exam
        if ($assignedCount > 0) {
            $allocated[] = [
                'exam'     => $exam['subject_name'],
                'date'     => $exam['exam_date'],
                'assigned' => $assignedCount,
                'required' => $exam['duties_required']
            ];
        } else {
            // No eligible faculty found for this exam
            $errors[] = "Could not allocate duties for: {$exam['subject_name']} - no eligible faculty available";
        }
    }

    // ── STEP 6: Return allocation summary ─────────────────────
    respond([
        'message'   => 'Allocation complete',
        'allocated' => $allocated,
        'skipped'   => $skipped,
        'errors'    => $errors,
        'summary'   => [
            'total_exams'             => count($exams),
            'successfully_allocated'  => count($allocated),
            'skipped'                 => count($skipped),
            'failed'                  => count($errors)
        ]
    ]);
}

// ── UPDATE ALLOCATION STATUS ──────────────────────────────────
elseif ($method === 'PUT') {
    
    // Admin can update the status of an allocation
    // Status options: assigned, acknowledged, completed, absent
    $body   = getBody();

    if (!validatePositiveInt($body['id'] ?? 0)) {
        respondError('Valid allocation ID is required');
    }
    $id     = sanitizeInt($body['id'], 1);
    $status = sanitizeStr($body['status'] ?? '', 20);

    if ($status === '' || !validateEnum($status, VALID_ALLOC_STATUSES)) {
        respondError('Invalid status. Allowed: ' . implode(', ', VALID_ALLOC_STATUSES));
    }

    $stmt = $db->prepare('UPDATE duty_allocations SET status = ? WHERE id = ?');
    $stmt->bind_param('si', $status, $id);
    $stmt->execute();

    if ($db->affected_rows === 0) {
        respondError('Allocation not found', 404);
    }

    respond(['message' => 'Allocation status updated successfully']);
}

// ── DELETE ALLOCATION ─────────────────────────────────────────
elseif ($method === 'DELETE') {
    
    // Admin can remove a single allocation (e.g., if faculty is sick)
    if (!validatePositiveInt($_GET['id'] ?? 0)) {
        respondError('Valid allocation ID is required');
    }
    $id = sanitizeInt($_GET['id'], 1);

    $stmt = $db->prepare('DELETE FROM duty_allocations WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();

    if ($db->affected_rows === 0) {
        respondError('Allocation not found', 404);
    }

    respond(['message' => 'Allocation removed successfully']);
}

else {
    respondError('Method not allowed', 405);
}
