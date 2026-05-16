<?php
include 'db_connection.php';

$result = mysqli_query($conn, 'DESCRIBE users');
echo "Users table structure:\n";
while ($row = mysqli_fetch_assoc($result)) {
    echo $row['Field'] . ' - ' . $row['Type'] . ' - ' . ($row['Null'] == 'YES' ? 'NULL' : 'NOT NULL') . "\n";
}
?>