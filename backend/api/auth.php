<?php
// backend/api/auth.php
require_once '../config/cors.php';
require_once '../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Create auth_tokens table if not exists
function ensureTokenTable($db) {
    $db->query("CREATE TABLE IF NOT EXISTS auth_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
}

if ($method === 'POST' && $action === 'login') {
    $body = getBody();
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if (!$email || !$password) {
        respondError('Email and password required');
    }

    $db = getDB();
    ensureTokenTable($db);

    $stmt = $db->prepare('SELECT u.*, fp.id as faculty_profile_id, fp.department, fp.employee_id 
                          FROM users u 
                          LEFT JOIN faculty_profiles fp ON fp.user_id = u.id 
                          WHERE u.email = ? AND u.is_active = 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    if (!$user || !password_verify($password, $user['password'])) {
        respondError('Invalid email or password', 401);
    }

    // Generate token
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+7 days'));

    // Delete old tokens for this user
    $stmt = $db->prepare('DELETE FROM auth_tokens WHERE user_id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();

    // Insert new token
    $stmt = $db->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
    $stmt->bind_param('iss', $user['id'], $token, $expires);
    $stmt->execute();

    respond([
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'department' => $user['department'],
        'employee_id' => $user['employee_id'],
        'faculty_profile_id' => $user['faculty_profile_id'],
        'token' => $token,
    ]);
}

elseif ($method === 'POST' && $action === 'logout') {
    $db = getDB();
    ensureTokenTable($db);
    $token = getAuthToken();
    if ($token) {
        $stmt = $db->prepare('DELETE FROM auth_tokens WHERE token = ?');
        $stmt->bind_param('s', $token);
        $stmt->execute();
    }
    respond(['message' => 'Logged out']);
}

elseif ($method === 'GET' && $action === 'me') {
    $db = getDB();
    ensureTokenTable($db);
    $user = requireAuth();
    respond($user);
}

else {
    respondError('Invalid request', 404);
}
