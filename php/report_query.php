<?php
function valid_date($d) {
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) === 1;
}

function fetch_report(PDO $pdo, string $from, string $to, int $classId): array {
    $sql = "SELECT s.full_name, s.student_number, c.class_name, a.attendance_date, a.status
            FROM attendance a
            JOIN students s ON s.id = a.student_id
            LEFT JOIN classes c ON c.id = s.class_id
            WHERE a.attendance_date BETWEEN ? AND ?
              AND (? = 0 OR s.class_id = ?)
            ORDER BY a.attendance_date DESC, s.full_name";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$from, $to, $classId, $classId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}