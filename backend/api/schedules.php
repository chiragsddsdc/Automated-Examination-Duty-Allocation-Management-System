<?php
// backend/api/schedules.php
require_once '../config/cors.php';
require_once '../config/db.php';

$user = requireAuth();
$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

if ($method === 'GET') {
    $result = $db->query('SELECT es.*, 
                          COUNT(da.id) as allocated_duties
                          FROM exam_schedules es
                          LEFT JOIN duty_allocations da ON da.exam_id = es.id
                          GROUP BY es.id
                          ORDER BY es.exam_date, es.start_time');
    respond($result->fetch_all(MYSQLI_ASSOC));
}

elseif ($method === 'POST') {
    requireAdmin();
    $body = getBody();
    $required = ['subject_name', 'subject_code', 'department', 'exam_date', 'start_time', 'end_time', 'venue', 'total_students', 'duties_required'];
    foreach ($required as $f) {
        if (empty($body[$f])) respondError("Field '$f' is required");
    }

    $stmt = $db->prepare('INSERT INTO exam_schedules (subject_name, subject_code, department, exam_date, start_time, end_time, venue, total_students, duties_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('sssssssii', 
        $body['subject_name'], $body['subject_code'], $body['department'],
        $body['exam_date'], $body['start_time'], $body['end_time'],
        $body['venue'], $body['total_students'], $body['duties_required']
    );
    $stmt->execute();
    respond(['message' => 'Schedule created', 'id' => $db->insert_id], 201);
}

elseif ($method === 'PUT') {
    requireAdmin();
    $body = getBody();
    $id = intval($body['id'] ?? 0);
    if (!$id) respondError('ID required');

    $stmt = $db->prepare('UPDATE exam_schedules SET subject_name=?, subject_code=?, department=?, exam_date=?, start_time=?, end_time=?, venue=?, total_students=?, duties_required=?, status=? WHERE id=?');
    $stmt->bind_param('sssssssiiis',
        $body['subject_name'], $body['subject_code'], $body['department'],
        $body['exam_date'], $body['start_time'], $body['end_time'],
        $body['venue'], $body['total_students'], $body['duties_required'],
        $body['status'], $id
    );
    $stmt->execute();
    respond(['message' => 'Schedule updated']);
}

elseif ($method === 'DELETE') {
    requireAdmin();
    $id = intval($_GET['id'] ?? 0);
    if (!$id) respondError('ID required');
    $stmt = $db->prepare('DELETE FROM exam_schedules WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    respond(['message' => 'Schedule deleted']);
}

else {
    respondError('Method not allowed', 405);
}
