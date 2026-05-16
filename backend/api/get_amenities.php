<?php
include_once __DIR__ . '/../db_connection.php';

// Select columns based on your DB screenshot
$sql = "SELECT * FROM req_amenity_reservation"; 

$result = $conn->query($sql);

if (!$result) {
    // This will tell us EXACTLY what is wrong with the SQL
    echo json_encode(["error" => $conn->error, "sql" => $sql]);
    exit;
}

$reservations = [];
while($row = $result->fetch_assoc()) {
    $reservations[] = $row;
}

echo json_encode($reservations);
$conn->close();
?>