<?php
/**
 * ============================================================
 * DASHBOARD STATISTICS API
 * ============================================================
 * 
 * Provides summary statistics and recent data for dashboards.
 * Returns DIFFERENT data depending on who is logged in:
 * 
 * ADMIN gets:
 * - Total active faculty count
 * - Total exams count
 * - Upcoming exams count
 * - Total duty allocations count
 * - Unread notifications count
 * - Recent allocations list (last 5)
 * - Department-wise workload data (for chart)
 * - Upcoming exams list (next 5)
 * 
 * FACULTY gets:
 * - Their total duty count
 * - Their upcoming duties count
 * - Their completed duties count
 * - Unread notifications count
 * - Their next 5 upcoming duties
 * 
 * ENDPOINT:
 * GET /dashboard.php → Returns stats for logged-in user's role
 * 
 * @author  Chirag Yadav
 * @project Automated Examination Duty Allocation System
 * ============================================================
 */

require_once '../config/cors.php';
require_once '../config/db.php';

// Verify user is logged in and get their data
$user = requireAuth();
$db = getDB();

// ── ADMIN DASHBOARD ───────────────────────────────────────────
if ($user['role'] === 'admin') {
    
    $stats = []; // Array to hold all statistics

    // Count total active faculty members
    $stats['total_faculty'] = $db->query(
        'SELECT COUNT(*) as c FROM users WHERE role="faculty" AND is_active=1'
    )->fetch_assoc()['c'];

    // Count total exams in system
    $stats['total_exams'] = $db->query(
        'SELECT COUNT(*) as c FROM exam_schedules'
    )->fetch_assoc()['c'];

    // Count upcoming scheduled exams (today or future)
    $stats['upcoming_exams'] = $db->query(
        'SELECT COUNT(*) as c FROM exam_schedules WHERE exam_date >= CURDATE() AND status="scheduled"'
    )->fetch_assoc()['c'];

    // Count total duty allocations made so far
    $stats['total_allocations'] = $db->query(
        'SELECT COUNT(*) as c FROM duty_allocations'
    )->fetch_assoc()['c'];

    // Count unread notifications across all users
    $stats['unread_notifications'] = $db->query(
        'SELECT COUNT(*) as c FROM notifications WHERE is_read=0'
    )->fetch_assoc()['c'];

    // Get 5 most recent duty allocations with full details
    // Used to show "Recent Activity" section on admin dashboard
    $recent = $db->query("SELECT da.allocated_at, u.name as faculty_name, 
                          es.subject_name, es.exam_date, es.venue, dt.name as duty_type
                          FROM duty_allocations da
                          JOIN faculty_profiles fp ON fp.id = da.faculty_id
                          JOIN users u ON u.id = fp.user_id
                          JOIN exam_schedules es ON es.id = da.exam_id
                          JOIN duty_types dt ON dt.id = da.duty_type_id
                          ORDER BY da.allocated_at DESC LIMIT 5");
    $stats['recent_allocations'] = $recent->fetch_all(MYSQLI_ASSOC);

    // Get duty count grouped by department
    // Used to render the bar chart on admin dashboard
    $dept = $db->query("SELECT fp.department, COUNT(da.id) as duty_count
                         FROM duty_allocations da
                         JOIN faculty_profiles fp ON fp.id = da.faculty_id
                         GROUP BY fp.department ORDER BY duty_count DESC");
    $stats['dept_workload'] = $dept->fetch_all(MYSQLI_ASSOC);

    // Get next 5 upcoming exams with allocation progress
    // Shows how many duties are filled vs required for each exam
    $upcoming = $db->query("SELECT es.*, COUNT(da.id) as allocated 
                             FROM exam_schedules es
                             LEFT JOIN duty_allocations da ON da.exam_id = es.id
                             WHERE es.exam_date >= CURDATE()
                             GROUP BY es.id ORDER BY es.exam_date LIMIT 5");
    $stats['upcoming_list'] = $upcoming->fetch_all(MYSQLI_ASSOC);

    respond($stats);

// ── FACULTY DASHBOARD ─────────────────────────────────────────
} else {
    
    // Get the faculty's user ID from their auth token
    $user_id = intval($user['id']);

    // Find this faculty member's profile ID
    // faculty_profiles.id is different from users.id
    $stmt = $db->prepare('SELECT fp.id FROM faculty_profiles fp WHERE fp.user_id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $profile = $stmt->get_result()->fetch_assoc();
    
    // If no faculty profile found, return error
    if (!$profile) respondError('Faculty profile not found', 404);

    $faculty_id = $profile['id']; // The faculty_profiles.id we'll use for queries
    $stats = [];

    // Count total duties ever assigned to this faculty
    $stmt = $db->prepare('SELECT COUNT(*) as c FROM duty_allocations WHERE faculty_id = ?');
    $stmt->bind_param('i', $faculty_id);
    $stmt->execute();
    $stats['total_duties'] = $stmt->get_result()->fetch_assoc()['c'];

    // Count upcoming duties (exam date is today or in the future)
    $stmt = $db->prepare("SELECT COUNT(*) as c FROM duty_allocations da 
                          JOIN exam_schedules es ON es.id = da.exam_id 
                          WHERE da.faculty_id = ? AND es.exam_date >= CURDATE()");
    $stmt->bind_param('i', $faculty_id);
    $stmt->execute();
    $stats['upcoming_duties'] = $stmt->get_result()->fetch_assoc()['c'];

    // Count duties marked as completed
    $stmt = $db->prepare("SELECT COUNT(*) as c FROM duty_allocations WHERE faculty_id = ? AND status = 'completed'");
    $stmt->bind_param('i', $faculty_id);
    $stmt->execute();
    $stats['completed_duties'] = $stmt->get_result()->fetch_assoc()['c'];

    // Get next 5 upcoming duties with full exam details
    $stmt = $db->prepare("SELECT da.*, es.subject_name, es.exam_date, es.start_time, 
                          es.end_time, es.venue, dt.name as duty_type
                          FROM duty_allocations da
                          JOIN exam_schedules es ON es.id = da.exam_id
                          JOIN duty_types dt ON dt.id = da.duty_type_id
                          WHERE da.faculty_id = ? AND es.exam_date >= CURDATE()
                          ORDER BY es.exam_date LIMIT 5");
    $stmt->bind_param('i', $faculty_id);
    $stmt->execute();
    $stats['upcoming_list'] = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    // Count unread notifications for this faculty member
    $stmt = $db->prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $stats['unread_notifications'] = $stmt->get_result()->fetch_assoc()['c'];

    respond($stats);
}
