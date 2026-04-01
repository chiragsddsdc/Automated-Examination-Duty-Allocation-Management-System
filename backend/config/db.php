<?php
// backend/config/db.php
define('DB_HOST', 'sql303.infinityfree.com');
define('DB_USER', 'if0_41548694');
define('DB_PASS', 'c036UXcqUv2e');
define('DB_NAME', 'if0_41548694_examduty');

function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
    }
    $conn->set_charset('utf8');
    return $conn;
}
