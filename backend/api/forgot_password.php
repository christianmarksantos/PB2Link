<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "../db_connection.php";

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['email'])) {
    echo json_encode(['success' => false, 'message' => 'Email is required']);
    exit;
}

$email = mysqli_real_escape_string($conn, trim($data['email']));

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Check if email exists
$query = "SELECT user_id FROM users WHERE email = '$email'";
$result = mysqli_query($conn, $query);

if (!$result) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
    exit;
}

if (mysqli_num_rows($result) == 0) {
    echo json_encode(['success' => false, 'message' => 'Email not found']);
    exit;
}

$row = mysqli_fetch_assoc($result);
$user_id = $row['user_id'];

// Generate reset token
$reset_token = bin2hex(random_bytes(32));
$reset_expiry = date('Y-m-d H:i:s', strtotime('+24 hours')); // Extended to 24 hours for testing

// Debug: log the generated token
error_log("Generated reset token: $reset_token, expires: $reset_expiry");

// Check if the reset columns exist on the shared users table
$check_columns = mysqli_query($conn, "SHOW COLUMNS FROM users LIKE 'reset_token'");
if (mysqli_num_rows($check_columns) == 0) {
    echo json_encode(['success' => false, 'message' => 'Password reset is not configured for the users table.']);
    exit;
}
$check_columns = mysqli_query($conn, "SHOW COLUMNS FROM users LIKE 'reset_expiry'");
if (mysqli_num_rows($check_columns) == 0) {
    echo json_encode(['success' => false, 'message' => 'Password reset is not configured for the users table.']);
    exit;
}

// Update user with reset token
$query = "UPDATE users SET reset_token = '$reset_token', reset_expiry = '$reset_expiry' WHERE user_id = '$user_id'";
if (mysqli_query($conn, $query)) {
    error_log("Successfully stored reset token for user $user_id");
    // Generate reset link pointing to the frontend
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
    $frontUrl = null;
    if ($origin) {
        $frontUrl = rtrim($origin, '/');
    } else {
        // fallback to the Vite dev server default port
        $frontUrl = 'http://localhost:5174';
    }

    $reset_link = "$frontUrl/reset-password?token=$reset_token";
    error_log("Using reset link URL: $reset_link");

    // For now, just log it. In production, send email.
    error_log("Password reset link for $email: $reset_link");

    echo json_encode([
        'success' => true,
        'message' => 'Password reset link has been sent to your email',
        'reset_link' => $reset_link // Include in response for testing
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to generate reset token: ' . mysqli_error($conn)]);
}
?>