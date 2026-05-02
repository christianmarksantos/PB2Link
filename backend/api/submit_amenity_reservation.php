<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Fixed: Moving up one folder to reach 'backend/db_connection.php'
include '../db_connection.php';

if (!$conn) {
    echo json_encode(["success" => false, "message" => "Database connection failed."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $resident_id = $_POST['resident_id'];
    $tracking_code = $_POST['tracking_code'];
    $venue = $_POST['venue'];
    $date = $_POST['date'];
    $time_slot = $_POST['time_slot'];
    $purpose = $_POST['purpose'];
    $contact_name = $_POST['contact_name'];
    $contact_number = $_POST['contact_number'];

    // Prevent duplicate bookings
    $check = $conn->prepare("SELECT request_id FROM req_amenity_reservation WHERE venue = ? AND reservation_date = ? AND time_slot = ? AND status IN ('Approved', 'Pending', 'Processing')");
    $check->bind_param("sss", $venue, $date, $time_slot);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "This slot has just been reserved. Please try another time."]);
        exit;
    }

    // Move up 2 levels from /backend/api to root /uploads/
    $upload_dir = "../../uploads/";
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    $id_front_path = "";
    $id_holding_path = "";
    $file_hash = substr(md5(time() . mt_rand()), 0, 13);

    if (isset($_FILES['id_front']) && $_FILES['id_front']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES["id_front"]["name"], PATHINFO_EXTENSION);
        $filename = $file_hash . "_front." . $ext;
        if (move_uploaded_file($_FILES["id_front"]["tmp_name"], $upload_dir . $filename)) {
            $id_front_path = "uploads/" . $filename;
        }
    }

    if (isset($_FILES['id_holding']) && $_FILES['id_holding']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES["id_holding"]["name"], PATHINFO_EXTENSION);
        $filename = $file_hash . "_holding." . $ext;
        if (move_uploaded_file($_FILES["id_holding"]["tmp_name"], $upload_dir . $filename)) {
            $id_holding_path = "uploads/" . $filename;
        }
    }

    // Fixed: Removed the extra "s" (Now exactly 10 's' and 'i' types matching 10 question marks)
    $stmt = $conn->prepare("INSERT INTO req_amenity_reservation (resident_id, tracking_code, venue, reservation_date, time_slot, purpose, contact_name, contact_number, id_front, id_holding, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')");
    $stmt->bind_param("isssssssss", $resident_id, $tracking_code, $venue, $date, $time_slot, $purpose, $contact_name, $contact_number, $id_front_path, $id_holding_path);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Reservation submitted successfully! Tracking ID: " . $tracking_code]);
    } else {
        echo json_encode(["success" => false, "message" => "Database insertion failed."]);
    }

    $stmt->close();
    $conn->close();
}
?>