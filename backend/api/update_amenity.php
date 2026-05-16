<?php
include_once __DIR__ . '/../db_connection.php';

// Get the POST data from React
$data = json_decode(file_get_contents("php://input"), true);

if(isset($data['request_id']) && isset($data['status'])) {
    $id = $conn->real_escape_string($data['request_id']);
    $status = $conn->real_escape_string($data['status']);

    // Update the record
    $sql = "UPDATE req_amenity_reservation SET status = '$status' WHERE request_id = '$id'";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["success" => true, "message" => "Status updated successfully"]);
    } else {
        echo json_encode(["success" => false, "error" => $conn->error]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Invalid input"]);
}

$conn->close();
?>