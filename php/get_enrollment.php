<?php
require 'db.php';
require 'auth.php';

$courseId = (int)($_GET['course_id'] ?? 0);

$stmt = $pdo->prepare('SELECT id, course_code, course_name FROM courses WHERE id = ? AND user_id = ?');
$stmt->execute([$courseId, $userId]);
$course = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$course) {
    http_response_code(404);
    echo json_encode(['error' => 'Course not found.']);
    exit;
}

$sql = "SELECT s.id, s.student_number, s.full_name, c.class_name,
               (e.id IS NOT NULL) AS enrolled
        FROM students s
        LEFT JOIN classes c ON c.id = s.class_id
        LEFT JOIN enrollments e ON e.student_id = s.id AND e.course_id = ?
        WHERE s.user_id = ?
        ORDER BY s.full_name";

$stmt = $pdo->prepare($sql);
$stmt->execute([$courseId, $userId]);

echo json_encode(['course' => $course, 'students' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);