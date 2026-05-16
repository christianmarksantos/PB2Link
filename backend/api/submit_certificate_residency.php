<?php
include '../db_connection.php'; 

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

try {
    $resident_id = $_POST['resident_id'] ?? 0;
    
    // 1. Verify Resident (Prepared Statement used for Security)
    $checkRes = $conn->prepare("SELECT resident_id FROM residents WHERE resident_id = ?");
    $checkRes->bind_param("i", $resident_id);
    $checkRes->execute();
    if (!$checkRes->get_result()->fetch_assoc()) {
        throw new Exception("Resident profile not found. Please log in again.");
    }

    // 2. Data Capture 
    $tracking_code      = $_POST['tracking_code'] ?? '';
    $fName              = $_POST['fName'] ?? '';
    $mName              = $_POST['mName'] ?? '';
    $lName              = $_POST['lName'] ?? '';
    $birth_date         = $_POST['birth_date'] ?? NULL;
    $address            = $_POST['address'] ?? '';
    $gender             = $_POST['gender'] ?? ''; // FIXED: Removed trailing spaces in key
    $civil_status       = $_POST['civil_status'] ?? '';
    $sector             = $_POST['sector'] ?? '';
    $residency_status   = $_POST['residency_status'] ?? '';
    $beneficiary_name   = $_POST['beneficiary_name'] ?? ''; // FIXED: Ensure this variable name matches below
    $years_in_PB2       = $_POST['years_in_PB2'] ?? 0;
    $purpose            = $_POST['purpose'] ?? '';

    // 3. Duplicate Request Check (HCI Efficiency: Prevents unnecessary mental load for admins)
    // FIXED: Corrected table name to match your schema 'req_certificate_residency'
    $checkDuplicate = $conn->prepare("SELECT request_id FROM req_certificate_residency 
                                      WHERE beneficiary_name = ? 
                                      AND purpose = ? 
                                      AND status NOT IN ('Claimed', 'Declined')");

    // FIXED: Changed $beneficiary to $beneficiary_name
    $checkDuplicate->bind_param("ss", $beneficiary_name, $purpose);
    $checkDuplicate->execute();

    if ($checkDuplicate->get_result()->fetch_assoc()) {
        throw new Exception("You already have an active request for '$purpose'. You can only submit a new one once the current one is Claimed or Declined.");
    }

    // 4. File Handling
    $upload_dir = "Resident_Submitted_Doc/Residency_Cert/" . $tracking_code . "/";
    if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

    $valid_id  = $upload_dir . "valid_id_" . uniqid() . ".png";
    $proof_doc = $upload_dir . "proof_residency_" . uniqid() . ".png";

    move_uploaded_file($_FILES['valid_id']['tmp_name'], $valid_id);
    move_uploaded_file($_FILES['proof_doc']['tmp_name'], $proof_doc);

    // 5. Secure Final Insertion (Blocks inputs like ' OR '1'='1)
    $sql = "INSERT INTO req_certificate_residency 
            (tracking_code, resident_id, fName, mName, lName, birth_date, address, gender, civil_status, sector, residency_status, beneficiary_name, years_in_PB2, purpose, valid_id, proof_doc, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sissssssssssisss", 
        $tracking_code, $resident_id, $fName, $mName, $lName, $birth_date, $address, $gender, $civil_status, $sector, $residency_status, $beneficiary_name, 
        $years_in_PB2, $purpose, $valid_id, $proof_doc
    );

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Residency request submitted successfully."]);
    } else {
        throw new Exception("Submission failed. Database error.");
    }

} catch (Exception $e) {
    http_response_code(5000);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
?>