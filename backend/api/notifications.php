<?php
// backend/api/notifications.php
require_once '../config/cors.php';
require_once '../config/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

if ($method === 'GET') {
    $user_id = intval($_GET['user_id'] ?? $user['id']);
    $stmt = $db->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $notifs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Count unread
    $stmt = $db->prepare('SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $unread = $stmt->get_result()->fetch_assoc()['unread'];

    respond(['notifications' => $notifs, 'unread_count' => $unread]);
}

elseif ($method === 'PUT') {
    $body = getBody();
    $user_id = intval($user['id']);

    if (!empty($body['mark_all'])) {
        $stmt = $db->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
    } elseif (!empty($body['id'])) {
        $id = intval($body['id']);
        $stmt = $db->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
        $stmt->bind_param('ii', $id, $user_id);
        $stmt->execute();
    }
    respond(['message' => 'Notifications marked as read']);
}

else {
    respondError('Method not allowed', 405);
}
