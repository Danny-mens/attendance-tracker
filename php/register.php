<?php
require 'db.php';
require 'signup_code.php';
session_start();

$data = json_decode(file_get_contents('php://input'), true);

$fullName = trim($data['full_name'] ?? '');
$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';
$code     = trim($data['signup_code'] ?? '');

if (!hash_equals(SIGNUP_CODE, $code)) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid sign-up code.']);
    exit;
}

if ($fullName === '' || strlen($fullName) > 100) {
    http_response_code(400);
    echo json_encode(['error' => 'Enter your full name (100 characters at most).']);
    exit;
}

if (!preg_match('/^[A-Za-z0-9_.]{3,30}$/', $username)) {
    http_response_code(400);
    echo json_encode(['error' => 'Username must be 3 to 30 characters: letters, numbers, dot or underscore.']);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode(['error' => 'Password must be at least 8 characters.']);
    exit;
}

try {
    $stmt = $pdo->prepare('INSERT INTO users (username, full_name, password_hash) VALUES (?, ?, ?)');
    $stmt->execute([$username, $fullName, password_hash($password, PASSWORD_DEFAULT)]);
    $newId = (int)$pdo->lastInsertId();

    session_regenerate_id(true);
    $_SESSION['user_id']   = $newId;
    $_SESSION['username']  = $username;
    $_SESSION['full_name'] = $fullName;

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        http_response_code(409);
        echo json_encode(['error' => 'That username is already taken.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not create the account.']);
    }
}