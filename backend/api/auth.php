<?php
/**
 * ============================================================
 * AUTHENTICATION API
 * ============================================================
 * 
 * Handles all authentication operations for the system.
 * Uses token-based authentication (NOT sessions) so that
 * React frontend and PHP backend can communicate securely
 * across different ports (3000 and 80).
 * 
 * ENDPOINTS:
 * POST /auth.php?action=login   → Login with email & password
 * POST /auth.php?action=logout  → Logout (delete token)
 * GET  /auth.php?action=me      → Get currently logged-in user
 * 
 * HOW LOGIN WORKS:
 * 1. User sends email + password
 * 2. We find user in DB and verify password using bcrypt
 * 3. We generate a secure random 64-character token
 * 4. Token is stored in auth_tokens table with 7-day expiry
 * 5. Token is sent back to React, which stores it in localStorage
 * 6. All future requests include this token in Authorization header
 * 
 * @author  Chirag Yadav
 * @project Automated Examination Duty Allocation System
 * ============================================================
 */

require_once '../config/cors.php';
require_once '../config/db.php';

// Get HTTP method and action from URL
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/**
 * ensureTokenTable() - Creates auth_tokens table if it doesn't exist
 * 
 * This is a safety function that runs on every auth request.
 * It makes sure the auth_tokens table exists in the database
 * before we try to use it.
 * 
 * @param mysqli $db - Active database connection
 */
function ensureTokenTable($db) {
    $db->query("CREATE TABLE IF NOT EXISTS auth_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,                    -- Which user owns this token
        token VARCHAR(64) NOT NULL UNIQUE,       -- The actual token string
        expires_at DATETIME NOT NULL,            -- When token becomes invalid
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
}

// ── LOGIN ─────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'login') {
    
    // Read email and password from request body
    $body = getBody();
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    // Validate that both fields are provided
    if (!$email || !$password) {
        respondError('Email and password required');
    }

    $db = getDB();
    ensureTokenTable($db); // Make sure token table exists

    // Find user by email and join with faculty profile if exists
    // We check is_active = 1 to prevent deactivated users from logging in
    $stmt = $db->prepare('SELECT u.*, fp.id as faculty_profile_id, fp.department, fp.employee_id 
                          FROM users u 
                          LEFT JOIN faculty_profiles fp ON fp.user_id = u.id 
                          WHERE u.email = ? AND u.is_active = 1');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    // Verify password using bcrypt (password_verify compares plain text with hash)
    // If user not found OR password wrong → same error (security best practice)
    if (!$user || !password_verify($password, $user['password'])) {
        respondError('Invalid email or password', 401);
    }

    // Generate a cryptographically secure random token (64 hex characters)
    $token = bin2hex(random_bytes(32));
    
    // Token expires in 7 days from now
    $expires = date('Y-m-d H:i:s', strtotime('+7 days'));

    // Delete any old tokens for this user (only one active session at a time)
    $stmt = $db->prepare('DELETE FROM auth_tokens WHERE user_id = ?');
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();

    // Store new token in database
    $stmt = $db->prepare('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
    $stmt->bind_param('iss', $user['id'], $token, $expires);
    $stmt->execute();

    // Send user data + token back to React
    // React will store the token in localStorage for future requests
    respond([
        'id'                 => $user['id'],
        'name'               => $user['name'],
        'email'              => $user['email'],
        'role'               => $user['role'],           // 'admin' or 'faculty'
        'department'         => $user['department'],
        'employee_id'        => $user['employee_id'],
        'faculty_profile_id' => $user['faculty_profile_id'],
        'token'              => $token,                  // ← React stores this
    ]);
}

// ── LOGOUT ────────────────────────────────────────────────────
elseif ($method === 'POST' && $action === 'logout') {
    $db = getDB();
    ensureTokenTable($db);
    
    // Get the token from request header
    $token = getAuthToken();
    
    if ($token) {
        // Delete token from database so it can no longer be used
        $stmt = $db->prepare('DELETE FROM auth_tokens WHERE token = ?');
        $stmt->bind_param('s', $token);
        $stmt->execute();
    }
    
    respond(['message' => 'Logged out successfully']);
}

// ── GET CURRENT USER ──────────────────────────────────────────
elseif ($method === 'GET' && $action === 'me') {
    $db = getDB();
    ensureTokenTable($db);
    
    // requireAuth() validates token and returns user data
    // If token is invalid/expired, it automatically sends 401 error
    $user = requireAuth();
    
    respond($user); // Send current user's data back to React
}

// ── INVALID REQUEST ───────────────────────────────────────────
else {
    respondError('Invalid request - Use ?action=login, logout, or me', 404);
}
