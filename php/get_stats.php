<?php
require 'db.php';
require 'auth.php';

date_default_timezone_set('Africa/Accra');
$today = date('Y-m-d');

function percent($attended, $counted) {
    return $counted > 0 ? (int)round($attended / $counted * 100) : null;
}

$stmt = $pdo->prepare('SELECT COUNT(*) FROM students WHERE user_id = ?');
$stmt->execute([$userId]);
$totalStudents = (int)$stmt->fetchColumn();

$stmt = $pdo->prepare('SELECT COUNT(*) FROM classes WHERE user_id = ?');
$stmt->execute([$userId]);
$totalClasses = (int)$stmt->fetchColumn();

// Today's totals
$stmt = $pdo->prepare("SELECT COALESCE(SUM(a.status = 'Present'), 0) AS present,
                              COALESCE(SUM(a.status = 'Late'), 0)    AS late,
                              COALESCE(SUM(a.status = 'Absent'), 0)  AS absent,
                              COALESCE(SUM(a.status = 'Excused'), 0) AS excused
                       FROM attendance a
                       JOIN students s ON s.id = a.student_id
                       WHERE s.user_id = ? AND a.attendance_date = ?");
$stmt->execute([$userId, $today]);
$t = array_map('intval', $stmt->fetch(PDO::FETCH_ASSOC));

$marked = $t['present'] + $t['late'] + $t['absent'] + $t['excused'];
$rate   = percent($t['present'] + $t['late'], $t['present'] + $t['late'] + $t['absent']);

// Last 7 days (null means nothing was saved that day)
$stmt = $pdo->prepare("SELECT COALESCE(SUM(a.status IN ('Present','Late')), 0) AS attended,
                              COALESCE(SUM(a.status IN ('Present','Late','Absent')), 0) AS counted
                       FROM attendance a
                       JOIN students s ON s.id = a.student_id
                       WHERE s.user_id = ? AND a.attendance_date = ?");
$trend = [];
for ($i = 6; $i >= 0; $i--) {
    $day = date('Y-m-d', strtotime("-$i day"));
    $stmt->execute([$userId, $day]);
    $r = $stmt->fetch(PDO::FETCH_ASSOC);
    $trend[] = [
        'label' => date('D', strtotime($day)),
        'rate'  => percent((int)$r['attended'], (int)$r['counted'])
    ];
}

// Rate per class
$stmt = $pdo->prepare("SELECT c.class_name,
                              COALESCE(SUM(a.status IN ('Present','Late')), 0) AS attended,
                              COALESCE(SUM(a.status IN ('Present','Late','Absent')), 0) AS counted
                       FROM classes c
                       LEFT JOIN students s ON s.class_id = c.id
                       LEFT JOIN attendance a ON a.student_id = s.id
                       WHERE c.user_id = ?
                       GROUP BY c.id, c.class_name
                       ORDER BY c.class_name");
$stmt->execute([$userId]);
$classes = [];
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
    $classes[] = [
        'class_name' => $r['class_name'],
        'rate'       => percent((int)$r['attended'], (int)$r['counted'])
    ];
}

// Latest saved records
$stmt = $pdo->prepare("SELECT s.full_name, s.student_number, c.class_name, a.attendance_date, a.status
                       FROM attendance a
                       JOIN students s ON s.id = a.student_id
                       LEFT JOIN classes c ON c.id = s.class_id
                       WHERE s.user_id = ?
                       ORDER BY a.attendance_date DESC, a.id DESC
                       LIMIT 8");
$stmt->execute([$userId]);
$recent = $stmt->fetchAll(PDO::FETCH_ASSOC);

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