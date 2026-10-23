<?php
require 'db.php';
require 'auth.php';

$data = json_decode(file_get_contents('php://input'), true);

$date    = $data['date'] ?? '';
$records = $data['records'] ?? [];
$allowed = ['Present', 'Absent', 'Late', 'Excused'];

if ($date === '' || !is_array($records)) {
    http_response_code(400);
    echo json_encode(['error' => 'Date and records are required.']);
    exit;
}

// Only this lecturer's own students may be marked
$mine = $pdo->prepare('SELECT id FROM students WHERE user_id = ?');
$mine->execute([$userId]);
$myIds = array_map('intval', $mine->fetchAll(PDO::FETCH_COLUMN));

$sql = "INSERT INTO attendance (student_id, attendance_date, status)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)";
$stmt = $pdo->prepare($sql);

try {
    $pdo->beginTransaction();
    foreach ($records as $r) {
        $studentId = (int)($r['student_id'] ?? 0);
        $status    = $r['status'] ?? '';
        if (!in_array($studentId, $myIds, true) || !in_array($status, $allowed, true)) {
            continue; // not this lecturer's student, or unmarked
        }
        $stmt->execute([$studentId, $date, $status]);
    }
    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Could not save attendance.']);
}