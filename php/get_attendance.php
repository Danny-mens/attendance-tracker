<?php
require 'db.php';
require 'auth.php';

$date    = $_GET['date'] ?? date('Y-m-d');
$classId = (int)($_GET['class_id'] ?? 0);

$sql = "SELECT s.id, s.student_number, s.full_name, s.class_id, c.class_name, a.status
        FROM students s
        LEFT JOIN classes c ON c.id = s.class_id
        LEFT JOIN attendance a ON a.student_id = s.id AND a.attendance_date = ?
        WHERE (? = 0 OR s.class_id = ?)
        ORDER BY s.full_name";

$stmt = $pdo->prepare($sql);
$stmt->execute([$date, $classId, $classId]);

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));