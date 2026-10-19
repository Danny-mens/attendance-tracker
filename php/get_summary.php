<?php
require 'db.php';
require 'auth.php';


$sql = "SELECT s.id, s.student_number, s.full_name,
        COALESCE(SUM(a.status = 'Present'), 0) AS present,
        COALESCE(SUM(a.status = 'Late'), 0) AS late,
        COALESCE(SUM(a.status = 'Absent'), 0) AS absent,
        COUNT(a.id) AS total
        FROM students s
        LEFT JOIN attendance a ON a.student_id = s.id
        GROUP BY s.id, s.student_number, s.full_name
        ORDER BY s.full_name";

$rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);

foreach ($rows as &$r) {
    $r['percentage'] = $r['total'] > 0
        ? round((($r['present'] + $r['late']) / $r['total']) * 100)
        : 0;
}
unset($r);

echo json_encode($rows);