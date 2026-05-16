<?php
/**
 * OFFICIAL BIMS REGISTER API - VERSION 2.2
 * Strategic Resident Profiling & Record Management
 */

// 1. FORCED JSON & CORS HANDLING
// These MUST be the absolute first lines.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle Preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Enable mysqli exceptions for the try-catch block
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    include "../db_connection.php";
    $response = ["success" => false, "message" => ""];

    if (!$conn) {
        throw new Exception("Registry Error: Unable to connect to the database. Please check your credentials.");
    }

    /**
     * Sequential User ID Generation
     */
    function generateUserId($conn) {
        $prefix = date("Ym"); 
        $query = "SELECT user_id FROM users WHERE user_id LIKE '$prefix%' ORDER BY user_id DESC LIMIT 1";
        $result = mysqli_query($conn, $query);
        if ($result && mysqli_num_rows($result) > 0) {
            $row = mysqli_fetch_assoc($result);
            return $row['user_id'] + 1;
        }
        return $prefix . "0001";
    }

    /**
     * Helper to convert empty strings to NULL for ENUM/Optional columns
     */
    function nullIfEmpty($val) {
        $trimmed = trim($val ?? '');
        return ($trimmed === "") ? NULL : $trimmed;
    }

    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        
        $email = mysqli_real_escape_string($conn, $_POST['email'] ?? '');
        
        // Check for existing email
        $check = mysqli_query($conn, "SELECT user_id FROM users WHERE email='$email'");
        if (mysqli_num_rows($check) > 0) {
            $response["message"] = "Official Record Error: This email address is already registered.";
            echo json_encode($response); exit();
        }

        // 2. FILE UPLOAD HANDLING
        $upload_dir = "uploads/";
        if (!is_dir($upload_dir)) mkdir($upload_dir, 0777, true);

        function upload($key, $dir) {
            if (isset($_FILES[$key]) && $_FILES[$key]['error'] == 0) {
                $ext = pathinfo($_FILES[$key]['name'], PATHINFO_EXTENSION);
                $name = uniqid($key . "_") . "." . $ext;
                if (move_uploaded_file($_FILES[$key]['tmp_name'], $dir . $name)) {
                    return $dir . $name;
                }
            }
            return NULL;
        }

        $id_front      = upload('valid_id_img_front', $upload_dir);
        $id_back       = upload('valid_id_img_back', $upload_dir);
        $id_hold       = upload('valid_id_img_holding', $upload_dir);
        $p_pwd         = upload('proof_pwd', $upload_dir);
        $p_4ps         = upload('proof_4ps', $upload_dir);
        $p_solo_parent = upload('proof_solo_parent', $upload_dir);
        $p_indigent    = upload('proof_indigent', $upload_dir);

        // 3. IDENTIFIERS & MAPPING
        $user_id   = generateUserId($conn);
        $pass_hash = password_hash($_POST['password'] ?? '', PASSWORD_DEFAULT);

        $is_senior      = (($_POST['is_senior'] ?? 'false') === 'true' ? 1 : 0);
        $is_pwd         = (($_POST['is_pwd'] ?? 'false') === 'true' ? 1 : 0);
        $is_4ps         = (($_POST['is_4ps'] ?? 'false') === 'true' ? 1 : 0);
        $is_solo_parent = (($_POST['is_solo_parent'] ?? 'false') === 'true' ? 1 : 0);
        $is_indigent    = (($_POST['is_indigent'] ?? 'false') === 'true' ? 1 : 0);
        
        $years_val      = intval($_POST['years_in_PB2'] ?? 1);

        // 4. DATABASE TRANSACTION
        mysqli_begin_transaction($conn);

        // Table: users
        $stmt1 = mysqli_prepare($conn, "INSERT INTO users (user_id, email, password_hash) VALUES (?, ?, ?)");
        mysqli_stmt_bind_param($stmt1, "iss", $user_id, $email, $pass_hash);
        mysqli_stmt_execute($stmt1);

        // Table: residents
        $sql2 = "INSERT INTO residents (
            user_id, fName, mName, lName, suffix, birth_date, gender, height, contact_num,
            civil_status, spouse_name_text, blood_type, birth_city, birth_province, birth_country, religion,
            is_senior, is_pwd, is_4ps, is_solo_parent, is_indigent,
            proof_pwd, proof_4ps, proof_solo_parent, proof_indigent,
            house_no, street, zone, subdivision, years_in_PB2, residency_status, 
            contact_person, contactp_num, contactp_relationship, philsys_nat_id, valid_id, 
            valid_id_img_front, valid_id_img_back, valid_id_img_holding, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')";

        $stmt2 = mysqli_prepare($conn, $sql2);
        
        // Exact 39 characters for types: isssssssssssssssiiiiissssssssisssssssss
        $types = "isssssssssssssssiiiiissssssssisssssssss";
        
        // Use nullIfEmpty for optional/enum fields to prevent SQL Strict Mode errors
        $suf     = nullIfEmpty($_POST['suffix'] ?? '');
        $mName   = nullIfEmpty($_POST['mName'] ?? '');
        $sName   = nullIfEmpty($_POST['spouse_name_text'] ?? '');
        $bType   = nullIfEmpty($_POST['blood_type'] ?? '');
        $vIDType = nullIfEmpty($_POST['valid_id'] ?? '');

        mysqli_stmt_bind_param($stmt2, $types, 
            $user_id, 
            $_POST['fName'], $mName, $_POST['lName'], $suf,
            $_POST['birth_date'], $_POST['gender'], $_POST['height'], $_POST['contact_num'],
            $_POST['civil_status'], $sName, $bType, $_POST['birth_city'], 
            $_POST['birth_province'], $_POST['birth_country'], $_POST['religion'],
            $is_senior, $is_pwd, $is_4ps, $is_solo_parent, $is_indigent,
            $p_pwd, $p_4ps, $p_solo_parent, $p_indigent,
            $_POST['house_no'], $_POST['street'], $_POST['zone'], $_POST['subdivision'],
            $years_val, 
            $_POST['residency_status'], $_POST['contact_person'],
            $_POST['contactp_num'], $_POST['contactp_relationship'], $_POST['philsys_nat_id'],
            $vIDType, 
            $id_front, $id_back, $id_hold
        );
        
        mysqli_stmt_execute($stmt2);

        mysqli_commit($conn);
        $response["success"] = true;
        $response["message"] = "Profiling Complete: Your records have been submitted for official verification.";

    } else {
        $response["message"] = "Security Protocol: Invalid Request Method.";
    }

} catch (Exception $e) {
    if (isset($conn) && $conn instanceof mysqli) mysqli_rollback($conn);
    $response["message"] = "System Exception: " . $e->getMessage();
}

echo json_encode($response);
?>