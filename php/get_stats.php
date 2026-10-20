<?php
require 'db.php';
require 'auth.php';

date_default_timezone_set('Africa/Accra');
$today = date('Y-m-d');

function percent($attended, $counted) {
    return $counted > 0 ? (int)round($attended / $counted * 100) : null;
}

$totalStudents = (int)$pdo->query('SELECT COUNT(*) FROM students')->fetchColumn();
$totalClasses  = (int)$pdo->query('SELECT COUNT(*) FROM classes')->fetchColumn();

// Today's totals
$stmt = $pdo->prepare("SELECT COALESCE(SUM(status = 'Present'), 0) AS present,
                              COALESCE(SUM(status = 'Late'), 0)    AS late,
                              COALESCE(SUM(status = 'Absent'), 0)  AS absent,
                              COALESCE(SUM(status = 'Excused'), 0) AS excused
                       FROM attendance WHERE attendance_date = ?");
$stmt->execute([$today]);
$t = array_map('intval', $stmt->fetch(PDO::FETCH_ASSOC));

$marked = $t['present'] + $t['late'] + $t['absent'] + $t['excused'];
$rate   = percent($t['present'] + $t['late'], $t['present'] + $t['late'] + $t['absent']);

// Last 7 days (null means nothing was saved that day)
$stmt = $pdo->prepare("SELECT COALESCE(SUM(status IN ('Present','Late')), 0) AS attended,
                              COALESCE(SUM(status IN ('Present','Late','Absent')), 0) AS counted
                       FROM attendance WHERE attendance_date = ?");
$trend = [];
for ($i = 6; $i >= 0; $i--) {
    $day = date('Y-m-d', strtotime("-$i day"));
    $stmt->execute([$day]);
    $r = $stmt->fetch(PDO::FETCH_ASSOC);
    $trend[] = [
        'label' => date('D', strtotime($day)),
        'rate'  => percent((int)$r['attended'], (int)$r['counted'])
    ];
}

// Rate per class
$rows = $pdo->query("SELECT c.class_name,
                            COALESCE(SUM(a.status IN ('Present','Late')), 0) AS attended,
                            COALESCE(SUM(a.status IN ('Present','Late','Absent')), 0) AS counted
                     FROM classes c
                     LEFT JOIN students s ON s.class_id = c.id
                     LEFT JOIN attendance a ON a.student_id = s.id
                     GROUP BY c.id, c.class_name
                     ORDER BY c.class_name")->fetchAll(PDO::FETCH_ASSOC);
$classes = [];
foreach ($rows as $r) {
    $classes[] = [
        'class_name' => $r['class_name'],
        'rate'       => percent((int)$r['attended'], (int)$r['counted'])
    ];
}

// Latest saved records
$recent = $pdo->query("SELECT s.full_name, s.student_number, c.class_name, a.attendance_date, a.status
                       FROM attendance a
                       JOIN students s ON s.id = a.student_id
                       LEFT JOIN classes c ON c.id = s.class_id
                       ORDER BY a.attendance_date DESC, a.id DESC
                       LIMIT 8")->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'totalStudents' => $totalStudents,
    'totalClasses'  => $totalClasses,
    'present'       => $t['present'],
    'late'          => $t['late'],
    'absent'        => $t['absent'],
    'excused'       => $t['excused'],
    'rate'          => $rate,
    'notMarked'     => max(0, $totalStudents - $marked),
    'trend'         => $trend,
    'classes'       => $classes,
    'recent'        => $recent
]);