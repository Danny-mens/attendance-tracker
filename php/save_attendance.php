<?php
require 'db.php';
require 'auth.php';

$data     = json_decode(file_get_contents('php://input'), true);
$date     = $data['date'] ?? '';
$courseId = (int)($data['course_id'] ?? 0);
$records  = $data['records'] ?? [];
$allowed  = ['Present', 'Absent', 'Late', 'Excused'];

if ($date === '' || $courseId <= 0 || !is_array($records)) {
    http_response_code(400);
    echo json_encode(['error' => 'Date, course and records are required.']);
    exit;
}

$own = $pdo->prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?');
$own->execute([$courseId, $userId]);
if (!$own->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['error' => 'Course not found.']);
    exit;
}

// Only this lecturer's students who are enrolled in this course
$enrolled = $pdo->prepare('SELECT s.id FROM enrollments e JOIN students s ON s.id = e.student_id
                           WHERE e.course_id = ? AND s.user_id = ?');
$enrolled->execute([$courseId, $userId]);
$okIds = array_map('intval', $enrolled->fetchAll(PDO::FETCH_COLUMN));

$sql = "INSERT INTO attendance (student_id, course_id, attendance_date, status)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE status = VALUES(status)";
$stmt = $pdo->prepare($sql);

try {
    $pdo->beginTransaction();
    foreach ($records as $r) {
        $studentId = (int)($r['student_id'] ?? 0);
        $status    = $r['status'] ?? '';
        if (!in_array($studentId, $okIds, true) || !in_array($status, $allowed, true)) {
            continue; // not enrolled here, or left unmarked
        }
        $stmt->execute([$studentId, $courseId, $date, $status]);
    }
    $pdo->commit();
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => 'Could not save attendance.']);
}