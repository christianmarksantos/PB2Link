<?php
include '../db_connection.php'; 

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

try {
    // Professional Security: Separating Input from Logic
    $resident_id = $_POST['resident_id'] ?? 0;
    
    // 1. Verify Resident using Prepared Statement
    $checkRes = $conn->prepare("SELECT resident_id FROM residents WHERE resident_id = ?");
    $checkRes->bind_param("i", $resident_id);
    $checkRes->execute();
    if (!$checkRes->get_result()->fetch_assoc()) {
        throw new Exception("Resident profile not found. Please complete your profile first.");
    }

    // 2. Capture and Anonymize/Sanitize Data (Data Privacy Act Compliance [cite: 111])
    $tracking_code  = $_POST['tracking_code'] ?? '';
    $fName          = $_POST['fName'] ?? '';
    $mName          = $_POST['mName'] ?? '';
    $lName          = $_POST['lName'] ?? '';
    $suffix         = $_POST['suffix'] ?? '';
    $birth_date     = $_POST['birth_date'] ?? NULL;
    $gender         = $_POST['gender'] ?? '';
    $civil_status   = $_POST['civil_status'] ?? 'Single';
    $address        = $_POST['address'] ?? '';
    $sector         = $_POST['sector'] ?? '';
    $request_mode   = $_POST['request_mode'] ?? 'Self';
    $beneficiary    = $_POST['beneficiary_name'] ?? '';
    $years_in_PB2   = $_POST['years_in_PB2'] ?? 0;
    $precinct_no    = $_POST['precinct_no'] ?? '';
    $purpose        = $_POST['purpose'] ?? '';

    // 3. Secure File Handling
    $upload_dir = "Resident_Submitted_Doc/Barangay_Clearance/" . $tracking_code . "/";
    if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

    // Using unique IDs prevents attackers from guessing file locations
    $id_front   = $upload_dir . "id_front_" . uniqid() . ".png";
    $id_back    = $upload_dir . "id_back_" . uniqid() . ".png";
    $id_holding = $upload_dir . "id_holding_" . uniqid() . ".png";

    move_uploaded_file($_FILES['id_front']['tmp_name'], $id_front);
    move_uploaded_file($_FILES['id_back']['tmp_name'], $id_back);
    move_uploaded_file($_FILES['id_holding']['tmp_name'], $id_holding);


// --- UPDATED PURPOSE-BASED DUPLICATE CHECK ---

// Check if a request for this SPECIFIC purpose is already active for this person
$checkDuplicate = $conn->prepare("SELECT request_id FROM req_barangay_clearance 
                                  WHERE beneficiary_name = ? 
                                  AND purpose = ? 
                                  AND status NOT IN ('Claimed', 'Declined')");

// We bind both the name and the purpose
$checkDuplicate->bind_param("ss", $beneficiary, $purpose);
$checkDuplicate->execute();

if ($checkDuplicate->get_result()->fetch_assoc()) {
    throw new Exception("You already have an active request for '$purpose'. You can only submit a new one for this purpose once the current one is Claimed or Declined.");
}

// --- END OF CHECK ---

    // 4. Secure SQL Injection Fix: Prepared Statements 
    $sql = "INSERT INTO req_barangay_clearance 
            (tracking_code, resident_id, fName, mName, lName, suffix, birth_date, gender, civil_status, address, sector, request_mode, beneficiary_name, years_in_PB2, precinct_no, purpose, id_front, id_back, id_holding, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')";

    $stmt = $conn->prepare($sql);
    // Securely bind parameters to prevent ' OR '1'='1 style attacks
    $stmt->bind_param("sisssssssssssisssss", 
        $tracking_code, $resident_id, $fName, $mName, $lName, $suffix, $birth_date, $gender, $civil_status, $address, $sector, $request_mode, $beneficiary, 
        $years_in_PB2, $precinct_no, $purpose, $id_front, $id_back, $id_holding
    );

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Request submitted securely."]);
    } else {
        throw new Exception("Execution failed. Please try again later.");
    }

} catch (Exception $e) {
    http_response_code(500);
    // Use generic messages in production to avoid leaking database structure
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>