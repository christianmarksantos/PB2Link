<?php


include '../db_connection.php'; 

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

try {
    // Check if resident_id exists to satisfy foreign key constraint
    $resident_id = $_POST['resident_id'] ?? 0;
    
    // Validate if resident exists
    $checkRes = $conn->prepare("SELECT resident_id FROM residents WHERE resident_id = ?");
    $checkRes->bind_param("i", $resident_id);
    $checkRes->execute();
    if (!$checkRes->get_result()->fetch_assoc()) {
        throw new Exception("Resident profile not found. Please complete your profile first.");
    }

    // Capture Data based on your .sql table structure
    $tracking_code  = $_POST['tracking_code'] ?? '';
    $fName          = $_POST['fName'] ?? '';
    $mName          = $_POST['mName'] ?? '';
    $lName          = $_POST['lName'] ?? '';
    $suffix         = $_POST['suffix'] ?? '';
    $civil_status   = $_POST['civil_status'] ?? 'Single';
    $address        = $_POST['address'] ?? '';
    $sector         = $_POST['sector'] ?? '';
    $request_mode   = $_POST['request_mode'] ?? 'Self';
    $beneficiary    = $_POST['beneficiary_name'] ?? '';
    $years_in_PB2   = $_POST['years_in_PB2'] ?? 0;
    $precinct_no    = $_POST['precinct_no'] ?? '';
    $purpose        = $_POST['purpose'] ?? '';

    // File Upload Handling
    $upload_dir = "Resident_Submitted_Doc/Barangay_Clearance/" . $tracking_code . "/";
    if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

    $id_front   = $upload_dir . "id_front_" . uniqid() . ".png";
    $id_back    = $upload_dir . "id_back_" . uniqid() . ".png";
    $id_holding = $upload_dir . "id_holding_" . uniqid() . ".png";

    move_uploaded_file($_FILES['id_front']['tmp_name'], $id_front);
    move_uploaded_file($_FILES['id_back']['tmp_name'], $id_back);
    move_uploaded_file($_FILES['id_holding']['tmp_name'], $id_holding);

    // SQL Match: req_barangay_clearance table
    $sql = "INSERT INTO req_barangay_clearance 
            (tracking_code, resident_id, fName, mName, lName, suffix, civil_status, address, sector, request_mode, beneficiary_name, years_in_PB2, precinct_no, purpose, id_front, id_back, id_holding, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sisssssssssisssss", 
        $tracking_code, $resident_id, $fName, $mName, $lName, $suffix, 
        $civil_status, $address, $sector, $request_mode, $beneficiary, 
        $years_in_PB2, $precinct_no, $purpose, $id_front, $id_back, $id_holding
    );

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Request submitted successfully"]);
    } else {
        throw new Exception($conn->error);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>