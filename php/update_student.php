<?php
require 'db.php';
require 'auth.php';
require 'class_helper.php';

$data = json_decode(file_get_contents('php://input'), true);

$id        = (int)($data['id'] ?? 0);
$number    = trim($data['student_number'] ?? '');
$name      = trim($data['full_name'] ?? '');
$className = trim($data['class_name'] ?? '');

if ($id <= 0 || $number === '' || $name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Student number and name are required.']);
    exit;
}

if (strlen($className) > 80) {
    http_response_code(400);
    echo json_encode(['error' => 'Class name is too long (80 characters at most).']);
    exit;
}

// Only the owner may edit a student
$stmt = $pdo->prepare('SELECT id FROM students WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $userId]);
if (!$stmt->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['error' => 'Student not found.']);
    exit;
}

try {
    $pdo->beginTransaction();
    $classId = class_id_for($pdo, $userId, $className);
    $stmt = $pdo->prepare('UPDATE students SET student_number = ?, full_name = ?, class_id = ? WHERE id = ? AND user_id = ?');
    $stmt->execute([$number, $name, $classId, $id, $userId]);
    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['error' => 'That student number is already used.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not update student.']);
    }
}