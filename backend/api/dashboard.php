<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

// Include the connection file from the parent directory
include __DIR__ . "/../db_connection.php"; 

$api = $_GET['api'] ?? '';

// Double check: Is your connection variable named $conn? 
// If your group uses $db, change $conn to $db below.
if (!$conn) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

try {
    if ($api === 'dashboard_counts') {
        // Helper function to safely get counts without crashing on column errors
        function getCount($conn, $query) {
            $result = $conn->query($query);
            return ($result) ? (int)$result->fetch_assoc()['count'] : 0;
        }

        // 1. Total (Simplest query - should always work if table exists)
        $total = getCount($conn, "SELECT COUNT(*) as count FROM residents");

        // 2. Active/Archived (Fails if 'status' column is missing or named differently)
        $active = getCount($conn, "SELECT COUNT(*) as count FROM residents WHERE status='Active'");
        $archived = getCount($conn, "SELECT COUNT(*) as count FROM residents WHERE status='Archived'");

        // 3. Pending Docs (Fails if table 'document_requests' doesn't exist)
        $pending = getCount($conn, "SELECT COUNT(*) as count FROM document_requests WHERE status='Pending'");

        echo json_encode([
            "total" => $total,
            "active" => $active,
            "archived" => $archived,
            "pending_docs" => $pending
        ]);
    } 

    elseif ($api === 'recent_residents') {
        $residents = [];
        
        // We use resident_id to sort in case 'created_at' doesn't exist in your table
        $sql = "SELECT resident_id, first_name, last_name FROM residents ORDER BY resident_id DESC LIMIT 5";
        $result = $conn->query($sql);
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $residents[] = $row;
            }
        }
        echo json_encode($residents);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

$conn->close();
?>