<?php
require 'db.php';
require 'auth.php';

$data = json_decode(file_get_contents('php://input'), true);
$id = (int)($data['id'] ?? 0);

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid course id.']);
    exit;
}

// Deleting a course also deletes its enrolments and its attendance records
$stmt = $pdo->prepare('DELETE FROM courses WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $userId]);

echo json_encode(['success' => true]);