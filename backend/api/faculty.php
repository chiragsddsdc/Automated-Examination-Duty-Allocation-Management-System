<?php
// backend/api/faculty.php
require_once '../config/cors.php';
require_once '../config/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

// GET all faculty
if ($method === 'GET' && empty($_GET['id'])) {
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

// GET single faculty
elseif ($method === 'GET' && !empty($_GET['id'])) {
    $id = intval($_GET['id']);
    $stmt = $db->prepare('SELECT u.id, u.name, u.email, fp.* 
                          FROM users u JOIN faculty_profiles fp ON fp.user_id = u.id
                          WHERE u.id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $faculty = $stmt->get_result()->fetch_assoc();
    if (!$faculty) respondError('Faculty not found', 404);
    respond($faculty);
}

// POST - Create faculty
elseif ($method === 'POST') {
    requireAdmin();
    $body = getBody();
    $name = trim($body['name'] ?? '');
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? 'faculty123';
    $employee_id = trim($body['employee_id'] ?? '');
    $department = trim($body['department'] ?? '');
    $designation = trim($body['designation'] ?? '');
    $experience_years = intval($body['experience_years'] ?? 0);
    $phone = trim($body['phone'] ?? '');
    $max_duties = intval($body['max_duties_per_week'] ?? 5);

    if (!$name || !$email || !$employee_id || !$department || !$designation) {
        respondError('All required fields must be filled');
    }

    $hashed = password_hash($password, PASSWORD_BCRYPT);

    $db->begin_transaction();
    try {
        $stmt = $db->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "faculty")');
        $stmt->bind_param('sss', $name, $email, $hashed);
        $stmt->execute();
        $user_id = $db->insert_id;

        $stmt = $db->prepare('INSERT INTO faculty_profiles (user_id, employee_id, department, designation, experience_years, phone, max_duties_per_week) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('isssssi', $user_id, $employee_id, $department, $designation, $experience_years, $phone, $max_duties);
        $stmt->execute();

        $db->commit();
        respond(['message' => 'Faculty created successfully', 'user_id' => $user_id], 201);
    } catch (Exception $e) {
        $db->rollback();
        respondError('Failed to create faculty: ' . $e->getMessage());
    }
}

// PUT - Update faculty
elseif ($method === 'PUT') {
    requireAdmin();
    $body = getBody();
    $id = intval($body['id'] ?? 0);
    if (!$id) respondError('ID required');

    $stmt = $db->prepare('UPDATE faculty_profiles SET department=?, designation=?, experience_years=?, phone=?, max_duties_per_week=? WHERE user_id=?');
    $stmt->bind_param('ssissi', $body['department'], $body['designation'], $body['experience_years'], $body['phone'], $body['max_duties_per_week'], $id);
    $stmt->execute();

    $stmt = $db->prepare('UPDATE users SET name=? WHERE id=?');
    $stmt->bind_param('si', $body['name'], $id);
    $stmt->execute();

    respond(['message' => 'Faculty updated successfully']);
}

// DELETE faculty
elseif ($method === 'DELETE') {
    requireAdmin();
    $id = intval($_GET['id'] ?? 0);
    if (!$id) respondError('ID required');

    $stmt = $db->prepare('UPDATE users SET is_active = 0 WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    respond(['message' => 'Faculty deactivated']);
}

else {
    respondError('Method not allowed', 405);
}
