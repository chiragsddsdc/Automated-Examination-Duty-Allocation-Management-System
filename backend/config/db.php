<?php
// backend/config/db.php
define('DB_HOST', 'midnightblue-woodcock-705637.hostingersite.com');
define('DB_USER', 'u915208031_examduty');
define('DB_PASS', 'wlbeqOCX;tho|gO0');
define('DB_NAME', 'u915208031_examduty');

function getDB() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
    }
    $conn->set_charset('utf8');
    return $conn;
}
