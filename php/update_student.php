<?php
require 'db.php';
require 'auth.php';

$data = json_decode(file_get_contents('php://input'), true);

$id      = (int)($data['id'] ?? 0);
$number  = trim($data['student_number'] ?? '');
$name    = trim($data['full_name'] ?? '');
$classId = (int)($data['class_id'] ?? 0);

if ($id <= 0 || $number === '' || $name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Student number and name are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare('UPDATE students SET student_number = ?, full_name = ?, class_id = ? WHERE id = ?');
    $stmt->execute([$number, $name, $classId > 0 ? $classId : null, $id]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['error' => 'That student number is already used.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not update student.']);
    }
}