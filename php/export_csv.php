<?php
require 'db.php';
require 'auth.php';
require 'report_query.php';

$from    = $_GET['from'] ?? '';
$to      = $_GET['to'] ?? '';
$classId = (int)($_GET['class_id'] ?? 0);

if (!valid_date($from) || !valid_date($to) || $from > $to) {
    http_response_code(400);
    exit('Choose a valid date range.');
}

$rows = fetch_report($pdo, $from, $to, $classId);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="attendance_' . $from . '_to_' . $to . '.csv"');

$out = fopen('php://output', 'w');
fputcsv($out, ['Student ID', 'Name', 'Class', 'Date', 'Status']);
foreach ($rows as $r) {
    fputcsv($out, [$r['student_number'], $r['full_name'], $r['class_name'] ?? '', $r['attendance_date'], $r['status']]);
}
fclose($out);