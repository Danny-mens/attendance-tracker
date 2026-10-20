<?php
require 'db.php';
require 'auth.php';
require 'report_query.php';

$from    = $_GET['from'] ?? '';
$to      = $_GET['to'] ?? '';
$classId = (int)($_GET['class_id'] ?? 0);

if (!valid_date($from) || !valid_date($to) || $from > $to) {
    http_response_code(400);
    echo json_encode(['error' => 'Choose a valid date range.']);
    exit;
}

$rows = fetch_report($pdo, $from, $to, $classId);

$counts = ['Present' => 0, 'Late' => 0, 'Absent' => 0, 'Excused' => 0];
foreach ($rows as $r) {
    $counts[$r['status']]++;
}

$counted = $counts['Present'] + $counts['Late'] + $counts['Absent'];   // excused days are not counted
$rate = $counted > 0
    ? (int)round(($counts['Present'] + $counts['Late']) / $counted * 100)
    : null;

echo json_encode(['counts' => $counts, 'rate' => $rate, 'rows' => $rows]);