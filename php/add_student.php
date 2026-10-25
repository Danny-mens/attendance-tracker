<?php
require 'db.php';
require 'auth.php';
require 'class_helper.php';

$data = json_decode(file_get_contents('php://input'), true);

$number    = trim($data['student_number'] ?? '');
$name      = trim($data['full_name'] ?? '');
$className = trim($data['class_name'] ?? '');
$courseId  = (int)($data['course_id'] ?? 0);

if ($number === '' || $name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Student number and name are required.']);
    exit;
}

if (strlen($className) > 80) {
    http_response_code(400);
    echo json_encode(['error' => 'Class name is too long (80 characters at most).']);
    exit;
}

$own = $pdo->prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?');
$own->execute([$courseId, $userId]);
if (!$own->fetchColumn()) {
    http_response_code(400);
    echo json_encode(['error' => 'Choose one of your courses first.']);
    exit;
}

try {
    $pdo->beginTransaction();
    $classId = class_id_for($pdo, $userId, $className);

    $stmt = $pdo->prepare('INSERT INTO students (user_id, student_number, full_name, class_id) VALUES (?, ?, ?, ?)');
    $stmt->execute([$userId, $number, $name, $classId]);
    $studentId = (int)$pdo->lastInsertId();

    $pdo->prepare('INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)')
        ->execute([$courseId, $studentId]);

    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['error' => 'That student number already exists.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not add student.']);
    }
}