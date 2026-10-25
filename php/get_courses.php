<?php
require 'db.php';
require 'auth.php';

$sql = "SELECT c.id, c.course_code, c.course_name, COUNT(e.id) AS student_count
        FROM courses c
        LEFT JOIN enrollments e ON e.course_id = c.id
        WHERE c.user_id = ?
        GROUP BY c.id, c.course_code, c.course_name
        ORDER BY c.course_code";

$stmt = $pdo->prepare($sql);
$stmt->execute([$userId]);

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));