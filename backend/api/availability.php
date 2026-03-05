<?php
// backend/api/availability.php
require_once '../config/cors.php';
require_once '../config/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

if ($method === 'GET') {
    $faculty_id = intval($_GET['faculty_id'] ?? 0);
    if ($faculty_id) {
        $stmt = $db->prepare('SELECT * FROM availability WHERE faculty_id = ? ORDER BY available_date, start_time');
        $stmt->bind_param('i', $faculty_id);
        $stmt->execute();
        respond($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    } else {
        // Admin: get all
        $result = $db->query('SELECT a.*, u.name as faculty_name FROM availability a
                              JOIN faculty_profiles fp ON fp.id = a.faculty_id
                              JOIN users u ON u.id = fp.user_id
                              ORDER BY a.available_date');
        respond($result->fetch_all(MYSQLI_ASSOC));
    }
}

elseif ($method === 'POST') {
    $body = getBody();
    $faculty_id = intval($body['faculty_id'] ?? 0);
    $slots = $body['slots'] ?? [];

    if (!$faculty_id || empty($slots)) respondError('faculty_id and slots required');

    $stmt = $db->prepare('INSERT INTO availability (faculty_id, available_date, start_time, end_time, is_available, reason)
                          VALUES (?, ?, ?, ?, ?, ?)
                          ON DUPLICATE KEY UPDATE is_available=VALUES(is_available), reason=VALUES(reason)');

    foreach ($slots as $slot) {
        $is_available = isset($slot['is_available']) ? intval($slot['is_available']) : 1;
        $reason = $slot['reason'] ?? '';
        $stmt->bind_param('isssss', $faculty_id, $slot['date'], $slot['start_time'], $slot['end_time'], $is_available, $reason);
        $stmt->execute();
    }

    respond(['message' => 'Availability saved']);
}

elseif ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) respondError('ID required');
    $stmt = $db->prepare('DELETE FROM availability WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    respond(['message' => 'Availability removed']);
}

else {
    respondError('Method not allowed', 405);
}
