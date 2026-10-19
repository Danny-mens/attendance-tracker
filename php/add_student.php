<?php
require 'db.php';
require 'auth.php';

$data = json_decode(file_get_contents('php://input'), true);

$number  = trim($data['student_number'] ?? '');
$name    = trim($data['full_name'] ?? '');
$classId = (int)($data['class_id'] ?? 0);

if ($number === '' || $name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Student number and name are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare('INSERT INTO students (student_number, full_name, class_id) VALUES (?, ?, ?)');
    $stmt->execute([$number, $name, $classId > 0 ? $classId : null]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['error' => 'That student number already exists.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not add student.']);
    }
}