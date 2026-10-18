<?php
require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);

$number = trim($data['student_number'] ?? '');
$name   = trim($data['full_name'] ?? '');

if ($number === '' || $name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Student number and name are required.']);
    exit;
}

try {
    $stmt = $pdo->prepare('INSERT INTO students (student_number, full_name) VALUES (?, ?)');
    $stmt->execute([$number, $name]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) { // duplicate student number
        http_response_code(409);
        echo json_encode(['error' => 'That student number already exists.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not add student.']);
    }
}