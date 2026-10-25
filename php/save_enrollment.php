<?php
require 'db.php';
require 'auth.php';

$data     = json_decode(file_get_contents('php://input'), true);
$courseId = (int)($data['course_id'] ?? 0);
$ids      = $data['student_ids'] ?? [];

if (!is_array($ids)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid student list.']);
    exit;
}

$own = $pdo->prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?');
$own->execute([$courseId, $userId]);
if (!$own->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['error' => 'Course not found.']);
    exit;
}

$mine = $pdo->prepare('SELECT id FROM students WHERE user_id = ?');
$mine->execute([$userId]);
$myIds = array_map('intval', $mine->fetchAll(PDO::FETCH_COLUMN));

try {
    $pdo->beginTransaction();

    // Past attendance is kept; only the list of enrolled students is replaced
    $pdo->prepare('DELETE FROM enrollments WHERE course_id = ?')->execute([$courseId]);

    $insert = $pdo->prepare('INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)');
    foreach (array_unique(array_map('intval', $ids)) as $studentId) {
        if (in_array($studentId, $myIds, true)) {
            $insert->execute([$courseId, $studentId]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Could not save the students.']);
}