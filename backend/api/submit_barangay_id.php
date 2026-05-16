<?php
include '../db_connection.php'; 

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

try {
    // 1. Capture Resident ID
    $resident_id = $_POST['resident_id'] ?? 0;
    
    // Verify Resident exists
    $checkRes = $conn->prepare("SELECT resident_id FROM residents WHERE resident_id = ?");
    $checkRes->bind_param("i", $resident_id);
    $checkRes->execute();
    if (!$checkRes->get_result()->fetch_assoc()) {
        throw new Exception("Resident profile not found.");
    }

    // 2. Capture Form Data (Matching your req_barangay_id SQL table columns)
    $tracking_code          = $_POST['tracking_code'] ?? '';
    $fName                  = $_POST['fName'] ?? '';
    $mName                  = $_POST['mName'] ?? '';
    $lName                  = $_POST['lName'] ?? '';
    $suffix                 = $_POST['suffix'] ?? '';
    $address                = $_POST['address'] ?? '';
    $birth_date             = $_POST['birth_date'] ?? NULL;
    $birth_place            = $_POST['birth_place'] ?? '';
    $contact_num            = $_POST['contact_num'] ?? '';
    $request_mode           = $_POST['request_mode'] ?? 'Self';
    $beneficiary_name       = $_POST['beneficiary_name'] ?? '';
    $height                 = $_POST['height'] ?? '';
    $weight                 = $_POST['weight'] ?? '';
    $blood_type             = $_POST['blood_type'] ?? '';
    $tin_no                 = $_POST['tin_no'] ?? '';
    $contact_person         = $_POST['contact_person'] ?? '';
    $contactp_num           = $_POST['contactp_num'] ?? '';
    $contactp_relationship  = $_POST['contactp_relationship'] ?? '';
    $emergency_address      = $_POST['emergency_address'] ?? '';

    // 3. Duplicate Check
    $checkDuplicate = $conn->prepare("SELECT request_id FROM req_barangay_id 
                                      WHERE beneficiary_name = ? 
                                      AND status NOT IN ('Claimed', 'Declined')");
    $checkDuplicate->bind_param("s", $beneficiary_name);
    $checkDuplicate->execute();

    if ($checkDuplicate->get_result()->fetch_assoc()) {
        throw new Exception("You already have an active Barangay ID request for this beneficiary.");
    }

    // 4. Secure File Handling
    $upload_dir = "Resident_Submitted_Doc/Barangay_ID/" . $tracking_code . "/";
    if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

    $id_picture_path = $upload_dir . "id_photo_" . uniqid() . ".png";
    $signature_path  = $upload_dir . "signature_" . uniqid() . ".png";

    if (!move_uploaded_file($_FILES['id_picture']['tmp_name'], $id_picture_path)) {
        throw new Exception("Failed to upload ID Picture.");
    }
    if (!move_uploaded_file($_FILES['signature']['tmp_name'], $signature_path)) {
        throw new Exception("Failed to upload Signature.");
    }

    // 5. Insert Data (22 placeholders for 22 columns + 1 hardcoded 'Pending')
    $sql = "INSERT INTO req_barangay_id 
            (tracking_code, resident_id, fName, mName, lName, suffix, address, birth_date, birth_place, contact_num, request_mode, beneficiary_name, height, weight, blood_type, tin_no, contact_person, contactp_num, contactp_relationship, emergency_address, id_picture, signature, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')";

    $stmt = $conn->prepare($sql);
    
    // Corrected bind_param string: 1 'i' and 21 's' = 22 total parameters
    $stmt->bind_param("sissssssssssssssssssss", 
        $tracking_code, 
        $resident_id, 
        $fName, 
        $mName, 
        $lName, 
        $suffix, 
        $address, 
        $birth_date, 
        $birth_place, 
        $contact_num, 
        $request_mode, 
        $beneficiary_name, 
        $height, 
        $weight, 
        $blood_type, 
        $tin_no, 
        $contact_person, 
        $contactp_num, 
        $contactp_relationship, 
        $emergency_address, 
        $id_picture_path, 
        $signature_path
    );

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Barangay ID request submitted."]);
    } else {
        throw new Exception("Database error: " . $stmt->error);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>