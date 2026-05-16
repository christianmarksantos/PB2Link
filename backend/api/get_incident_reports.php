<?php
header('Content-Type: application/json');
require_once '../db_connection.php';
session_start();

// Get user ID from request
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'User ID required']);
    exit;
}

try {
    // Query incident reports for the user
    $query = "SELECT 
        id,
        tracking_id as tracking_code,
        incident_type,
        status,
        created_at as submitted_date,
        notes
    FROM incident_reports 
    WHERE user_id = ? 
    ORDER BY created_at DESC";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reports = [];
    while ($row = $result->fetch_assoc()) {
        $reports[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $reports,
        'count' => count($reports)
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
