<?php
require 'db.php';
require 'auth.php';

$sql = "SELECT s.id, s.student_number, s.full_name,
        COALESCE(SUM(a.status = 'Present'), 0) AS present,
        COALESCE(SUM(a.status = 'Late'), 0) AS late,
        COALESCE(SUM(a.status = 'Absent'), 0) AS absent,
        COALESCE(SUM(a.status = 'Excused'), 0) AS excused
        FROM students s
        LEFT JOIN attendance a ON a.student_id = s.id
        WHERE s.user_id = ?
        GROUP BY s.id, s.student_number, s.full_name
        ORDER BY s.full_name";

$stmt = $pdo->prepare($sql);
$stmt->execute([$userId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($rows as &$r) {
    $counted = $r['present'] + $r['late'] + $r['absent'];   // excused days are not counted
    $r['percentage'] = $counted > 0
        ? round((($r['present'] + $r['late']) / $counted) * 100)
        : 0;
}
unset($r);

echo json_encode($rows);