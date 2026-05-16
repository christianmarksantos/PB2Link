<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include "../db_connection.php";

// Validate required fields
$required_fields = ['user_id', 'reporter_name', 'reporter_address', 'reporter_contact', 'reporter_email', 'contact_person_name', 'contact_person_number', 'incident_address', 'description', 'incident_class', 'reporting_class', 'track_code'];

foreach ($required_fields as $field) {
    if (!isset($_POST[$field]) || empty($_POST[$field])) {
        echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
        exit;
    }
}

if (!isset($_FILES['attachment']) || empty($_FILES['attachment']['name'])) {
    echo json_encode(['success' => false, 'message' => 'Evidence attachment is required']);
    exit;
}

// Sanitize input data
$user_id = intval($_POST['user_id']);
$reporter_name = mysqli_real_escape_string($conn, $_POST['reporter_name']);
$reporter_address = mysqli_real_escape_string($conn, $_POST['reporter_address']);
$reporter_contact = mysqli_real_escape_string($conn, $_POST['reporter_contact']);
$reporter_email = mysqli_real_escape_string($conn, $_POST['reporter_email']);
$contact_person_name = mysqli_real_escape_string($conn, $_POST['contact_person_name']);
$contact_person_number = mysqli_real_escape_string($conn, $_POST['contact_person_number']);
$incident_address = mysqli_real_escape_string($conn, $_POST['incident_address']);
$description = mysqli_real_escape_string($conn, $_POST['description']);
$incident_class = mysqli_real_escape_string($conn, $_POST['incident_class']);
$reporting_class = mysqli_real_escape_string($conn, $_POST['reporting_class']);
$track_code = mysqli_real_escape_string($conn, $_POST['track_code']);
$status = 'Pending';
$attachment_path = null;
$attachment_type = null;

// Handle required file upload
$allowed_image = ['jpg', 'jpeg', 'png'];
$allowed_video = ['mp4'];

$file_ext = strtolower(pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION));

if (in_array($file_ext, $allowed_image)) {
    $attachment_type = 'image';
} elseif (in_array($file_ext, $allowed_video)) {
    $attachment_type = 'video';
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, and MP4 are allowed.']);
    exit;
}

// Validate file size (10MB max)
if ($_FILES['attachment']['size'] > 10 * 1024 * 1024) {
    echo json_encode(['success' => false, 'message' => 'File size exceeds 10MB limit.']);
    exit;
}

// Create upload directory if it doesn't exist
$upload_dir = "../api/uploads/incidents/";
if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// Generate unique filename
$file_name = uniqid("incident_") . "." . $file_ext;
$attachment_path = $upload_dir . $file_name;

// Move uploaded file
if (!move_uploaded_file($_FILES['attachment']['tmp_name'], $attachment_path)) {
    echo json_encode(['success' => false, 'message' => 'Failed to upload file.']);
    exit;
}

// Check if incident_reports table exists, if not create it
$table_check = "CREATE TABLE IF NOT EXISTS incident_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reporter_name VARCHAR(255) NOT NULL,
    reporter_address TEXT,
    reporter_contact VARCHAR(20),
    reporter_email VARCHAR(255),
    contact_person_name VARCHAR(255),
    contact_person_number VARCHAR(20),
    incident_address TEXT NOT NULL,
    description LONGTEXT NOT NULL,
    attachment_path VARCHAR(255),
    attachment_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Pending',
    track_code VARCHAR(50) UNIQUE NOT NULL,
    incident_class VARCHAR(100),
    reporting_class VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX (track_code),
    INDEX (status),
    INDEX (created_at)
)";

if (!mysqli_query($conn, $table_check)) {
    error_log("Table creation error: " . mysqli_error($conn));
}

// Insert incident report into database
$query = "INSERT INTO incident_reports 
    (user_id, reporter_name, reporter_address, reporter_contact, reporter_email, contact_person_name, contact_person_number, incident_address, description, attachment_path, attachment_type, status, track_code, incident_class, reporting_class)
    VALUES 
    ($user_id, '$reporter_name', '$reporter_address', '$reporter_contact', '$reporter_email', '$contact_person_name', '$contact_person_number', '$incident_address', '$description', '$attachment_path', '$attachment_type', '$status', '$track_code', '$incident_class', '$reporting_class')";

if (mysqli_query($conn, $query)) {
    $incident_id = mysqli_insert_id($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Incident report submitted successfully',
        'incident_id' => $incident_id,
        'track_code' => $track_code
    ]);
} else {
    // If track_code already exists, generate a new one
    if (strpos(mysqli_error($conn), 'Duplicate entry') !== false) {
        echo json_encode([
            'success' => false,
            'message' => 'Tracking code already exists. Please try again.'
        ]);
    } else {
        error_log("Database error: " . mysqli_error($conn));
        echo json_encode([
            'success' => false,
            'message' => 'Failed to submit incident report. Please try again.'
        ]);
    }
}

mysqli_close($conn);
?>
