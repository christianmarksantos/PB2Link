<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
include "../db_connection.php";

if (!isset($_GET['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'User ID required']);
    exit;
}

// Security: Use mysqli_real_escape_string or intval to prevent SQL Injection
$user_id = intval($_GET['user_id']);

// Use r.* to grab everything from the residents table
// We keep the LEFT JOIN to ensure we also get the email from the users table
$query = "SELECT 
            r.*, 
            u.email 
          FROM residents r
          LEFT JOIN users u ON r.user_id = u.user_id
          WHERE r.user_id = $user_id";

$result = mysqli_query($conn, $query);

if ($result && mysqli_num_rows($result) > 0) {
    $data = mysqli_fetch_assoc($result);
    
    // Optional: Standardize gender/status for the frontend if needed
    echo json_encode(['success' => true, 'data' => $data]);
} else {
    echo json_encode(['success' => false, 'message' => 'Profile not found']);
}
?>