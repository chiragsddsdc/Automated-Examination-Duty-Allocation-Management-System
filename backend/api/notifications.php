<?php
/**
 * ============================================================
 * NOTIFICATIONS API
 * ============================================================
 *
 * GET /notifications.php        → Get logged-in user's notifications
 * PUT /notifications.php        → Mark one or all as read
 *
 * Security applied:
 *  - Users can ONLY read and mark their own notifications
 *    (user_id is always taken from the verified auth token, never from
 *     a query/body parameter, preventing IDOR attacks)
 *  - notification ID validated as positive integer on PUT
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

// user_id is ALWAYS sourced from the validated auth token — never from input
$user_id = (int) $user['id'];

// ── GET NOTIFICATIONS ─────────────────────────────────────────
if ($method === 'GET') {

    // Fetch notifications for the logged-in user only
    $stmt = $db->prepare(
        'SELECT * FROM notifications
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50'
    );
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $notifs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Count unread
    $stmt = $db->prepare(
        'SELECT COUNT(*) as unread FROM notifications
         WHERE user_id = ? AND is_read = 0'
    );
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $unread = (int) $stmt->get_result()->fetch_assoc()['unread'];

    respond(['notifications' => $notifs, 'unread_count' => $unread]);
}

// ── MARK NOTIFICATIONS AS READ ────────────────────────────────
elseif ($method === 'PUT') {

    $body = getBody();

    if (!empty($body['mark_all'])) {
        // Mark ALL of the logged-in user's notifications as read
        $stmt = $db->prepare(
            'UPDATE notifications SET is_read = 1 WHERE user_id = ?'
        );
        $stmt->bind_param('i', $user_id);
        $stmt->execute();

    } elseif (!empty($body['id'])) {
        // Mark a specific notification as read
        if (!validatePositiveInt($body['id'])) {
            respondError('Valid notification ID is required');
        }
        $notif_id = sanitizeInt($body['id'], 1);

        // The WHERE clause includes user_id so a user cannot mark someone
        // else's notification as read (IDOR protection)
        $stmt = $db->prepare(
            'UPDATE notifications SET is_read = 1
             WHERE id = ? AND user_id = ?'
        );
        $stmt->bind_param('ii', $notif_id, $user_id);
        $stmt->execute();

    } else {
        respondError('Provide either "id" or "mark_all" in the request body');
    }

    respond(['message' => 'Notifications marked as read']);
}

else {
    respondError('Method not allowed', 405);
}
