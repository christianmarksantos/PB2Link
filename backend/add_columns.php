<?php
include 'BPB2Link/db_connection.php';

$query = 'ALTER TABLE users ADD COLUMN reset_token VARCHAR(64) NULL, ADD COLUMN reset_expiry DATETIME NULL';
if (mysqli_query($conn, $query)) {
    echo 'Columns added successfully';
} else {
    echo 'Error: ' . mysqli_error($conn);
}
?>