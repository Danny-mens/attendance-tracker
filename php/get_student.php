<?php
require 'db.php';
require 'auth.php';

$id = (int)($_GET['id'] ?? 0);

$stmt = $pdo->prepare('SELECT id, student_number, full_name, class_id FROM students WHERE id = ?');
$stmt->execute([$id]);
$student = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$student) {
    http_response_code(404);
    echo json_encode(['error' => 'Student not found.']);
    exit;
}

echo json_encode($student);