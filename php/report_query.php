<?php
function valid_date($d) {
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) === 1;
}

function fetch_report(PDO $pdo, int $userId, string $from, string $to, int $classId, int $courseId): array {
    $sql = "SELECT s.full_name, s.student_number, c.class_name, co.course_code, a.attendance_date, a.status
            FROM attendance a
            JOIN students s ON s.id = a.student_id
            JOIN courses co ON co.id = a.course_id
            LEFT JOIN classes c ON c.id = s.class_id
            WHERE s.user_id = ?
              AND a.attendance_date BETWEEN ? AND ?
              AND (? = 0 OR s.class_id = ?)
              AND (? = 0 OR a.course_id = ?)
            ORDER BY a.attendance_date DESC, co.course_code, s.full_name";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId, $from, $to, $classId, $classId, $courseId, $courseId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}