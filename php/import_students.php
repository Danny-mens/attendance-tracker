<?php
require 'db.php';
require 'auth.php';
require 'class_helper.php';

$data     = json_decode(file_get_contents('php://input'), true);
$courseId = (int)($data['course_id'] ?? 0);
$mode     = ($data['mode'] ?? 'skip') === 'update' ? 'update' : 'skip';
$rows     = $data['rows'] ?? [];

if (!is_array($rows) || count($rows) === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'There are no students to import.']);
    exit;
}

if (count($rows) > 1000) {
    http_response_code(400);
    echo json_encode(['error' => 'Import at most 1000 students at a time.']);
    exit;
}

$own = $pdo->prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?');
$own->execute([$courseId, $userId]);
if (!$own->fetchColumn()) {
    http_response_code(404);
    echo json_encode(['error' => 'Course not found.']);
    exit;
}

$find            = $pdo->prepare('SELECT id FROM students WHERE user_id = ? AND student_number = ?');
$insert          = $pdo->prepare('INSERT INTO students (user_id, student_number, full_name, class_id) VALUES (?, ?, ?, ?)');
$updateWithClass = $pdo->prepare('UPDATE students SET full_name = ?, class_id = ? WHERE id = ? AND user_id = ?');
$updateNameOnly  = $pdo->prepare('UPDATE students SET full_name = ? WHERE id = ? AND user_id = ?');
$enrol           = $pdo->prepare('INSERT IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)');

$result = ['added' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []];

try {
    $pdo->beginTransaction();

    foreach ($rows as $r) {
        $line   = (int)($r['line'] ?? 0);
        $number = trim((string)($r['student_number'] ?? ''));
        $name   = trim((string)($r['full_name'] ?? ''));
        $class  = trim((string)($r['class_name'] ?? ''));

        if ($number === '' || $name === '') {
            $result['errors'][] = ['line' => $line, 'message' => 'Student ID and name are required.'];
            continue;
        }
        if (strlen($number) > 20 || strlen($name) > 100 || strlen($class) > 80) {
            $result['errors'][] = ['line' => $line, 'message' => 'A value is too long.'];
            continue;
        }

        $find->execute([$userId, $number]);
        $existingId = $find->fetchColumn();

        if ($existingId !== false) {
            $studentId = (int)$existingId;

            if ($mode === 'update') {
                if ($class !== '') {
                    $classId = class_id_for($pdo, $userId, $class);
                    $updateWithClass->execute([$name, $classId, $studentId, $userId]);
                } else {
                    $updateNameOnly->execute([$name, $studentId, $userId]);   // empty class keeps the current one
                }
                $result['updated']++;
            } else {
                $result['skipped']++;
            }
        } else {
            $classId = class_id_for($pdo, $userId, $class);
            $insert->execute([$userId, $number, $name, $classId]);
            $studentId = (int)$pdo->lastInsertId();
            $result['added']++;
        }

        $enrol->execute([$courseId, $studentId]);
    }

    $pdo->commit();
    echo json_encode($result);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => 'The import failed. Nothing was saved.']);
}