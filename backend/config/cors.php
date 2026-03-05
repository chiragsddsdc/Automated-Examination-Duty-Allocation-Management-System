<?php
// backend/config/cors.php
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function respondError($message, $code = 400) {
    respond(['error' => $message], $code);
}

function getBody() {
    return json_decode(file_get_contents('php://input'), true);
}

function getAuthToken() {
    $headers = getallheaders();
    if (!empty($headers['Authorization'])) {
        return str_replace('Bearer ', '', $headers['Authorization']);
    }
    if (!empty($headers['X-Auth-Token'])) {
        return $headers['X-Auth-Token'];
    }
    if (!empty($_GET['token'])) {
        return $_GET['token'];
    }
    return null;
}

function requireAuth() {
    require_once __DIR__ . '/db.php';
    $token = getAuthToken();
    if (!$token) {
        respondError('Unauthorized - No token', 401);
    }
    $db = getDB();
    $stmt = $db->prepare('SELECT u.id, u.name, u.role, u.email, fp.id as faculty_profile_id 
                          FROM auth_tokens t
                          JOIN users u ON u.id = t.user_id
                          LEFT JOIN faculty_profiles fp ON fp.user_id = u.id
                          WHERE t.token = ? AND t.expires_at > NOW()');
    $stmt->bind_param('s', $token);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    if (!$user) {
        respondError('Unauthorized - Invalid or expired token', 401);
    }
    return $user;
}

function requireAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        respondError('Forbidden - Admin only', 403);
    }
    return $user;
}
