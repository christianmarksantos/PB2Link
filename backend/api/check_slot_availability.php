<?php
// Strict CORS Headers (React to PHP communication)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Fixed: Moving up one folder to reach 'backend/db_connection.php'
include '../db_connection.php'; 

// Check if connection was successful
if (!$conn) {
    echo json_encode(["available" => false, "message" => "Database connection failed."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['venue'], $data['date'], $data['time_slot'])) {
    echo json_encode(["available" => false, "message" => "Invalid or missing parameters."]);
    exit;
}

$venue = $data['venue'];
$date = $data['date'];
$time_slot = $data['time_slot'];

try {
    $stmt = $conn->prepare("SELECT request_id FROM req_amenity_reservation WHERE venue = ? AND reservation_date = ? AND time_slot = ? AND status IN ('Approved', 'Pending', 'Processing')");
    $stmt->bind_param("sss", $venue, $date, $time_slot);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows > 0) {
        echo json_encode(["available" => false]);
    } else {
        echo json_encode(["available" => true]);
    }
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(["available" => false, "message" => "SQL Error: " . $e->getMessage()]);
}

$conn->close();
?>