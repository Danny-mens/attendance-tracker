<?php
require 'db.php';
require 'auth.php';
require 'report_query.php';
function csv_safe($value) {
    $value = (string)$value;
    return ($value !== '' && strpos('=+-@', $value[0]) !== false) ? "'" . $value : $value;
}

$from    = $_GET['from'] ?? '';
$to      = $_GET['to'] ?? '';
$classId = (int)($_GET['class_id'] ?? 0);
$courseId = (int)($_GET['course_id'] ?? 0);

if (!valid_date($from) || !valid_date($to) || $from > $to) {
    http_response_code(400);
    exit('Choose a valid date range.');
}
$rows = fetch_report($pdo, $userId, $from, $to, $classId, $courseId);
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="attendance_' . $from . '_to_' . $to . '.csv"');

$out = fopen('php://output', 'w');
fputcsv($out, ['Student ID', 'Name', 'Class', 'Course', 'Date', 'Status']);
foreach ($rows as $r) {
fputcsv($out, array_map('csv_safe', [$r['student_number'], $r['full_name'], $r['class_name'] ?? '', $r['course_code'], $r['attendance_date'], $r['status']]));}

fclose($out);