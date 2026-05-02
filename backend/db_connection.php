<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "barangay_bims";

// Turn off reporting so it doesn't "echo" errors into your JSON
mysqli_report(MYSQLI_REPORT_OFF); 

$conn = mysqli_connect($host, $user, $pass, $db);

// If connection fails, we don't want a "Fatal Error"
if (!$conn) {
    // We will handle the error inside login.php instead
    $conn = false; 
}
?>