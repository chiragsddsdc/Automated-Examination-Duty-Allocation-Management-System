<?php
/**
 * ============================================================
 * FACULTY MANAGEMENT API
 * ============================================================
 *
 * GET    /faculty.php          → List all faculty
 * GET    /faculty.php?id=X     → Get single faculty
 * POST   /faculty.php          → Create faculty (Admin)
 * PUT    /faculty.php          → Update faculty (Admin)
 * DELETE /faculty.php?id=X     → Deactivate faculty (Admin)
 *
 * Security applied:
 *  - All string inputs sanitized (trim + htmlspecialchars)
 *  - Email format validated (RFC 5321)
 *  - Department and designation validated against allowed enums
 *  - Integer fields validated for range
 *  - Phone validated by regex
 *  - All DB queries use prepared statements
 *
 * @author  Chirag Yadav
 * @project Automated Examination Duty Allocation System
 * ============================================================
 */

require_once '../config/cors.php';
require_once '../config/db.php';
require_once '../config/validation.php';

$session = requireAuth();
$method  = $_SERVER['REQUEST_METHOD'];
$db      = getDB();

// ── GET ALL FACULTY ───────────────────────────────────────────
if ($method === 'GET' && empty($_GET['id'])) {

    // No user input used in this query — safe as-is
    $result = $db->query(
        'SELECT u.id, u.name, u.email, u.is_active,
                fp.id as profile_id, fp.employee_id, fp.department,
                fp.designation, fp.experience_years, fp.phone, fp.max_duties_per_week,
                COUNT(da.id) as total_duties
         FROM users u
         JOIN faculty_profiles fp ON fp.user_id = u.id
         LEFT JOIN duty_allocations da ON da.faculty_id = fp.id
         WHERE u.role = "faculty"
         GROUP BY u.id, fp.id
         ORDER BY u.name'
    );
    respond($result->fetch_all(MYSQLI_ASSOC));
}

// ── GET SINGLE FACULTY ────────────────────────────────────────
elseif ($method === 'GET' && !empty($_GET['id'])) {

    // Validate ID is a positive integer
    if (!validatePositiveInt($_GET['id'])) {
        respondError('Invalid faculty ID');
    }
    $id = sanitizeInt($_GET['id'], 1);

    $stmt = $db->prepare(
        'SELECT u.id, u.name, u.email, fp.*
         FROM users u
         JOIN faculty_profiles fp ON fp.user_id = u.id
         WHERE u.id = ?'
    );
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $faculty = $stmt->get_result()->fetch_assoc();

    if (!$faculty) respondError('Faculty not found', 404);
    respond($faculty);
}

// ── CREATE NEW FACULTY ────────────────────────────────────────
elseif ($method === 'POST') {

    requireAdmin();
    $body = getBody();

    // ── SANITIZE all string inputs ────────────────────────────
    $name        = sanitizeStr($body['name']        ?? '', 100);
    $email       = sanitizeStr($body['email']       ?? '', 150);
    $password    = trim($body['password']            ?? 'faculty123'); // raw — will be hashed
    $employee_id = sanitizeStr($body['employee_id'] ?? '', 20);
    $department  = sanitizeStr($body['department']  ?? '', 100);
    $designation = sanitizeStr($body['designation'] ?? '', 100);
    $phone       = sanitizeStr($body['phone']       ?? '', 15);

    $experience_years = sanitizeInt($body['experience_years']    ?? 0, 0, 50);
    $max_duties       = sanitizeInt($body['max_duties_per_week'] ?? 5, 1, 20);

    // ── VALIDATE required string fields ──────────────────────
    if ($name === '') {
        respondError('Name is required');
    }
    if (!validateLength($name, 2, 100)) {
        respondError('Name must be between 2 and 100 characters');
    }

    if ($email === '') {
        respondError('Email is required');
    }
    if (!validateEmail($email)) {
        respondError('Invalid email address format');
    }

    if ($employee_id === '') {
        respondError('Employee ID is required');
    }
    if (!validateLength($employee_id, 2, 20)) {
        respondError('Employee ID must be between 2 and 20 characters');
    }
    // Only alphanumeric + hyphens/underscores allowed in employee ID
    if (!preg_match('/^[A-Za-z0-9\-_]+$/', $employee_id)) {
        respondError('Employee ID may only contain letters, numbers, hyphens, and underscores');
    }

    if ($department === '') {
        respondError('Department is required');
    }
    if (!validateEnum($department, VALID_DEPARTMENTS)) {
        respondError('Invalid department. Allowed: ' . implode(', ', VALID_DEPARTMENTS));
    }

    if ($designation === '') {
        respondError('Designation is required');
    }
    if (!validateEnum($designation, VALID_DESIGNATIONS)) {
        respondError('Invalid designation. Allowed: ' . implode(', ', VALID_DESIGNATIONS));
    }

    if (!validatePhone($phone)) {
        respondError('Invalid phone number format (7–15 digits, spaces, +, -, () allowed)');
    }

    if (!validateLength($password, 4, 72)) {
        respondError('Password must be between 4 and 72 characters');
    }

    // Hash password — NEVER store plain text
    $hashed = password_hash($password, PASSWORD_BCRYPT);

    // Transaction: both inserts succeed or both are rolled back
    $db->begin_transaction();
    try {
        $stmt = $db->prepare(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "faculty")'
        );
        $stmt->bind_param('sss', $name, $email, $hashed);
        $stmt->execute();
        $user_id = $db->insert_id;

        $stmt = $db->prepare(
            'INSERT INTO faculty_profiles
                (user_id, employee_id, department, designation, experience_years, phone, max_duties_per_week)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('isssisi', $user_id, $employee_id, $department, $designation,
                          $experience_years, $phone, $max_duties);
        $stmt->execute();

        $db->commit();
        respond(['message' => 'Faculty created successfully', 'user_id' => $user_id], 201);

    } catch (Exception $e) {
        $db->rollback();
        // Duplicate email or employee_id triggers a MySQL unique constraint error
        if (str_contains($e->getMessage(), 'Duplicate entry')) {
            respondError('A faculty member with that email or employee ID already exists');
        }
        respondError('Failed to create faculty. Please try again.');
    }
}

// ── UPDATE FACULTY ────────────────────────────────────────────
elseif ($method === 'PUT') {

    requireAdmin();
    $body = getBody();

    // Validate ID
    if (!validatePositiveInt($body['id'] ?? 0)) {
        respondError('Valid faculty ID is required');
    }
    $id = sanitizeInt($body['id'], 1);

    // ── SANITIZE ──────────────────────────────────────────────
    $name        = sanitizeStr($body['name']        ?? '', 100);
    $department  = sanitizeStr($body['department']  ?? '', 100);
    $designation = sanitizeStr($body['designation'] ?? '', 100);
    $phone       = sanitizeStr($body['phone']       ?? '', 15);

    $experience_years = sanitizeInt($body['experience_years']    ?? 0, 0, 50);
    $max_duties       = sanitizeInt($body['max_duties_per_week'] ?? 5, 1, 20);

    // ── VALIDATE ──────────────────────────────────────────────
    if ($name === '' || !validateLength($name, 2, 100)) {
        respondError('Name must be between 2 and 100 characters');
    }
    if ($department === '' || !validateEnum($department, VALID_DEPARTMENTS)) {
        respondError('Invalid department. Allowed: ' . implode(', ', VALID_DEPARTMENTS));
    }
    if ($designation === '' || !validateEnum($designation, VALID_DESIGNATIONS)) {
        respondError('Invalid designation. Allowed: ' . implode(', ', VALID_DESIGNATIONS));
    }
    if (!validatePhone($phone)) {
        respondError('Invalid phone number format');
    }

    // Update profile details
    $stmt = $db->prepare(
        'UPDATE faculty_profiles
         SET department=?, designation=?, experience_years=?, phone=?, max_duties_per_week=?
         WHERE user_id=?'
    );
    $stmt->bind_param('ssissi', $department, $designation, $experience_years,
                      $phone, $max_duties, $id);
    $stmt->execute();

    // Update display name
    $stmt = $db->prepare('UPDATE users SET name=? WHERE id=?');
    $stmt->bind_param('si', $name, $id);
    $stmt->execute();

    respond(['message' => 'Faculty updated successfully']);
}

// ── DEACTIVATE FACULTY ────────────────────────────────────────
elseif ($method === 'DELETE') {

    requireAdmin();

    if (!validatePositiveInt($_GET['id'] ?? 0)) {
        respondError('Valid faculty ID is required');
    }
    $id = sanitizeInt($_GET['id'], 1);

    // Soft delete — preserves historical duty records
    $stmt = $db->prepare('UPDATE users SET is_active = 0 WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();

    if ($db->affected_rows === 0) {
        respondError('Faculty not found', 404);
    }

    respond(['message' => 'Faculty deactivated successfully']);
}

else {
    respondError('Method not allowed', 405);
}
