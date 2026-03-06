<?php
/**
 * ============================================================
 * FACULTY MANAGEMENT API
 * ============================================================
 * 
 * Handles all CRUD (Create, Read, Update, Delete) operations
 * for faculty members in the system.
 * 
 * ENDPOINTS:
 * GET    /faculty.php          → Get all faculty members
 * GET    /faculty.php?id=X     → Get single faculty member
 * POST   /faculty.php          → Add new faculty (Admin only)
 * PUT    /faculty.php          → Update faculty (Admin only)
 * DELETE /faculty.php?id=X     → Deactivate faculty (Admin only)
 * 
 * NOTE: Faculty are never permanently deleted from the database.
 * Instead, they are "deactivated" (is_active = 0) so that
 * historical duty records remain intact.
 * 
 * A faculty member has TWO records:
 * 1. users table          → login credentials (email, password, role)
 * 2. faculty_profiles table → professional details (dept, designation, etc.)
 * 
 * @author  Chirag Yadav
 * @project Automated Examination Duty Allocation System
 * ============================================================
 */

require_once '../config/cors.php';
require_once '../config/db.php';

// Verify the request has a valid auth token
$session = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

// ── GET ALL FACULTY ───────────────────────────────────────────
if ($method === 'GET' && empty($_GET['id'])) {
    
    // Fetch all faculty with their profile details and total duty count
    // LEFT JOIN duty_allocations to count how many duties each faculty has
    $result = $db->query('SELECT u.id, u.name, u.email, u.is_active,
                          fp.id as profile_id, fp.employee_id, fp.department, 
                          fp.designation, fp.experience_years, fp.phone, fp.max_duties_per_week,
                          COUNT(da.id) as total_duties
                          FROM users u
                          JOIN faculty_profiles fp ON fp.user_id = u.id
                          LEFT JOIN duty_allocations da ON da.faculty_id = fp.id
                          WHERE u.role = "faculty"
                          GROUP BY u.id, fp.id
                          ORDER BY u.name');
    
    respond($result->fetch_all(MYSQLI_ASSOC));
}

// ── GET SINGLE FACULTY ────────────────────────────────────────
elseif ($method === 'GET' && !empty($_GET['id'])) {
    
    $id = intval($_GET['id']); // Convert to integer for safety
    
    $stmt = $db->prepare('SELECT u.id, u.name, u.email, fp.* 
                          FROM users u JOIN faculty_profiles fp ON fp.user_id = u.id
                          WHERE u.id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $faculty = $stmt->get_result()->fetch_assoc();
    
    // Return 404 if faculty not found
    if (!$faculty) respondError('Faculty not found', 404);
    
    respond($faculty);
}

// ── CREATE NEW FACULTY ────────────────────────────────────────
elseif ($method === 'POST') {
    
    // Only admins can create faculty accounts
    requireAdmin();
    
    // Read form data from request body
    $body = getBody();
    $name         = trim($body['name'] ?? '');
    $email        = trim($body['email'] ?? '');
    $password     = $body['password'] ?? 'faculty123'; // Default password
    $employee_id  = trim($body['employee_id'] ?? '');
    $department   = trim($body['department'] ?? '');
    $designation  = trim($body['designation'] ?? '');
    $experience_years = intval($body['experience_years'] ?? 0);
    $phone        = trim($body['phone'] ?? '');
    $max_duties   = intval($body['max_duties_per_week'] ?? 5);

    // Validate required fields
    if (!$name || !$email || !$employee_id || !$department || !$designation) {
        respondError('All required fields must be filled');
    }

    // Hash the password using bcrypt before storing
    // NEVER store plain text passwords in the database!
    $hashed = password_hash($password, PASSWORD_BCRYPT);

    // Use transaction so both inserts succeed or both fail together
    $db->begin_transaction();
    try {
        // Step 1: Create user account (login credentials)
        $stmt = $db->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "faculty")');
        $stmt->bind_param('sss', $name, $email, $hashed);
        $stmt->execute();
        $user_id = $db->insert_id; // Get the ID of newly created user

        // Step 2: Create faculty profile (professional details)
        // Links to user account via user_id foreign key
        $stmt = $db->prepare('INSERT INTO faculty_profiles (user_id, employee_id, department, designation, experience_years, phone, max_duties_per_week) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('isssssi', $user_id, $employee_id, $department, $designation, $experience_years, $phone, $max_duties);
        $stmt->execute();

        $db->commit(); // Save both records to database
        respond(['message' => 'Faculty created successfully', 'user_id' => $user_id], 201);
        
    } catch (Exception $e) {
        $db->rollback(); // Undo everything if anything failed
        respondError('Failed to create faculty: ' . $e->getMessage());
    }
}

// ── UPDATE FACULTY ────────────────────────────────────────────
elseif ($method === 'PUT') {
    
    // Only admins can update faculty details
    requireAdmin();
    
    $body = getBody();
    $id = intval($body['id'] ?? 0);
    if (!$id) respondError('Faculty ID is required');

    // Update professional details in faculty_profiles table
    $stmt = $db->prepare('UPDATE faculty_profiles SET department=?, designation=?, experience_years=?, phone=?, max_duties_per_week=? WHERE user_id=?');
    $stmt->bind_param('ssissi', $body['department'], $body['designation'], $body['experience_years'], $body['phone'], $body['max_duties_per_week'], $id);
    $stmt->execute();

    // Update name in users table
    $stmt = $db->prepare('UPDATE users SET name=? WHERE id=?');
    $stmt->bind_param('si', $body['name'], $id);
    $stmt->execute();

    respond(['message' => 'Faculty updated successfully']);
}

// ── DEACTIVATE FACULTY ────────────────────────────────────────
elseif ($method === 'DELETE') {
    
    // Only admins can deactivate faculty
    requireAdmin();
    
    $id = intval($_GET['id'] ?? 0);
    if (!$id) respondError('Faculty ID is required');

    // Soft delete: set is_active = 0 instead of actually deleting
    // This preserves all historical duty allocation records
    $stmt = $db->prepare('UPDATE users SET is_active = 0 WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    
    respond(['message' => 'Faculty deactivated successfully']);
}

else {
    respondError('Method not allowed', 405);
}
