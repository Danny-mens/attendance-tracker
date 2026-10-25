<?php
require 'db.php';
require 'auth.php';

$date     = $_GET['date'] ?? date('Y-m-d');
$courseId = (int)($_GET['course_id'] ?? 0);
$classId  = (int)($_GET['class_id'] ?? 0);

$sql = "SELECT s.id, s.student_number, s.full_name, s.class_id, c.class_name, a.status
        FROM enrollments e
        JOIN students s ON s.id = e.student_id
        LEFT JOIN classes c ON c.id = s.class_id
        LEFT JOIN attendance a ON a.student_id = s.id AND a.course_id = e.course_id AND a.attendance_date = ?
        WHERE e.course_id = ? AND s.user_id = ? AND (? = 0 OR s.class_id = ?)
        ORDER BY s.full_name";

$stmt = $pdo->prepare($sql);
$stmt->execute([$date, $courseId, $userId, $classId, $classId]);

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));