<?php
require 'db.php';
require 'auth.php';

$data = json_decode(file_get_contents('php://input'), true);
$code = trim($data['course_code'] ?? '');
$name = trim($data['course_name'] ?? '');

if ($code === '' || $name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Course code and name are required.']);
    exit;
}

if (strlen($code) > 30 || strlen($name) > 120) {
    http_response_code(400);
    echo json_encode(['error' => 'Course code (30 characters) or name (120 characters) is too long.']);
    exit;
}

try {
    $stmt = $pdo->prepare('INSERT INTO courses (user_id, course_code, course_name) VALUES (?, ?, ?)');
    $stmt->execute([$userId, $code, $name]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['error' => 'That course code already exists.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not add course.']);
    }
}