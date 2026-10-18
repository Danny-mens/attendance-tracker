<?php
header('Content-Type: application/json');

$host = 'localhost';
$dbname = 'attendance_db';
$user = 'root';   // XAMPP default
$pass = '';       // XAMPP default is empty

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}