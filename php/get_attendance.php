<?php
require 'db.php';

$date = $_GET['date'] ?? date('Y-m-d');

$sql = "SELECT s.id, s.student_number, s.full_name, a.status
        FROM students s
        LEFT JOIN attendance a
          ON a.student_id = s.id AND a.attendance_date = ?
        ORDER BY s.full_name";

$stmt = $pdo->prepare($sql);
$stmt->execute([$date]);

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));