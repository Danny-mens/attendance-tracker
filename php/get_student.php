<?php
require 'db.php';
require 'auth.php';

$id = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare('SELECT s.id, s.student_number, s.full_name, s.class_id, c.class_name
                       FROM students s
                       LEFT JOIN classes c ON c.id = s.class_id
                       WHERE s.id = ? AND s.user_id = ?');
$stmt->execute([$id, $userId]);
$student = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$student) {
    http_response_code(404);
    echo json_encode(['error' => 'Student not found.']);
    exit;
}

echo json_encode($student);