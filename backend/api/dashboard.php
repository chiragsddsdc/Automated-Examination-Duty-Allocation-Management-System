<?php
// backend/api/dashboard.php
require_once '../config/cors.php';
require_once '../config/db.php';

$user = requireAuth();
$db = getDB();

if ($user["role"] === 'admin') {
    $stats = [];

    $stats['total_faculty'] = $db->query('SELECT COUNT(*) as c FROM users WHERE role="faculty" AND is_active=1')->fetch_assoc()['c'];
    $stats['total_exams'] = $db->query('SELECT COUNT(*) as c FROM exam_schedules')->fetch_assoc()['c'];
    $stats['upcoming_exams'] = $db->query('SELECT COUNT(*) as c FROM exam_schedules WHERE exam_date >= CURDATE() AND status="scheduled"')->fetch_assoc()['c'];
    $stats['total_allocations'] = $db->query('SELECT COUNT(*) as c FROM duty_allocations')->fetch_assoc()['c'];
    $stats['unread_notifications'] = $db->query('SELECT COUNT(*) as c FROM notifications WHERE is_read=0')->fetch_assoc()['c'];

    // Recent allocations
    $recent = $db->query("SELECT da.allocated_at, u.name as faculty_name, es.subject_name, es.exam_date, es.venue, dt.name as duty_type
                          FROM duty_allocations da
                          JOIN faculty_profiles fp ON fp.id = da.faculty_id
                          JOIN users u ON u.id = fp.user_id
                          JOIN exam_schedules es ON es.id = da.exam_id
                          JOIN duty_types dt ON dt.id = da.duty_type_id
                          ORDER BY da.allocated_at DESC LIMIT 5");
    $stats['recent_allocations'] = $recent->fetch_all(MYSQLI_ASSOC);

    // Department workload
    $dept = $db->query("SELECT fp.department, COUNT(da.id) as duty_count
                         FROM duty_allocations da
                         JOIN faculty_profiles fp ON fp.id = da.faculty_id
                         GROUP BY fp.department ORDER BY duty_count DESC");
    $stats['dept_workload'] = $dept->fetch_all(MYSQLI_ASSOC);

    // Upcoming exams list
    $upcoming = $db->query("SELECT es.*, COUNT(da.id) as allocated 
                             FROM exam_schedules es
                             LEFT JOIN duty_allocations da ON da.exam_id = es.id
                             WHERE es.exam_date >= CURDATE()
                             GROUP BY es.id ORDER BY es.exam_date LIMIT 5");
    $stats['upcoming_list'] = $upcoming->fetch_all(MYSQLI_ASSOC);

    respond($stats);

} else {
    // Faculty dashboard
    $user_id = intval($user['id']);

    $stmt = $db->prepare('SELECT fp.id FROM faculty_profiles fp WHERE fp.user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $profile = $stmt->get_result()->fetch_assoc();
    if (!$profile) respondError('Faculty profile not found', 404);

    $faculty_id = $profile['id'];
    $stats = [];

    $stmt = $db->prepare('SELECT COUNT(*) as c FROM duty_allocations WHERE faculty_id = ?');
    $stmt->bind_param('i', $faculty_id);
    $stmt->execute();
    $stats['total_duties'] = $stmt->get_result()->fetch_assoc()['c'];

    $stmt = $db->prepare("SELECT COUNT(*) as c FROM duty_allocations da JOIN exam_schedules es ON es.id = da.exam_id WHERE da.faculty_id = ? AND es.exam_date >= CURDATE()");
    $stmt->bind_param('i', $faculty_id);
    $stmt->execute();
    $stats['upcoming_duties'] = $stmt->get_result()->fetch_assoc()['c'];

    $stmt = $db->prepare("SELECT COUNT(*) as c FROM duty_allocations WHERE faculty_id = ? AND status = 'completed'");
    $stmt->bind_param('i', $faculty_id);
    $stmt->execute();
    $stats['completed_duties'] = $stmt->get_result()->fetch_assoc()['c'];

    // My upcoming duties
    $stmt = $db->prepare("SELECT da.*, es.subject_name, es.exam_date, es.start_time, es.end_time, es.venue, dt.name as duty_type
                          FROM duty_allocations da
                          JOIN exam_schedules es ON es.id = da.exam_id
                          JOIN duty_types dt ON dt.id = da.duty_type_id
                          WHERE da.faculty_id = ? AND es.exam_date >= CURDATE()
                          ORDER BY es.exam_date LIMIT 5");
    $stmt->bind_param('i', $faculty_id);
    $stmt->execute();
    $stats['upcoming_list'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $stmt = $db->prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $stats['unread_notifications'] = $stmt->get_result()->fetch_assoc()['c'];

    respond($stats);
}
