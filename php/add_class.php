<?php
require 'db.php';
require 'auth.php';

$data  = json_decode(file_get_contents('php://input'), true);
$name  = trim($data['class_name'] ?? '');
$level = trim($data['level'] ?? '');

if ($name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Class name is required.']);
    exit;
}

try {
    $stmt = $pdo->prepare('INSERT INTO classes (user_id, class_name, level) VALUES (?, ?, ?)');
    $stmt->execute([$userId, $name, $level === '' ? null : $level]);
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['error' => 'That class already exists.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not add class.']);
    }
}