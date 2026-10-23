<?php
require 'db.php';
require 'auth.php';

$data = json_decode(file_get_contents('php://input'), true);
$id = (int)($data['id'] ?? 0);

if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid class id.']);
    exit;
}
$stmt = $pdo->prepare('DELETE FROM classes WHERE id = ? AND user_id = ?');
$stmt->execute([$id, $userId]);

echo json_encode(['success' => true]);