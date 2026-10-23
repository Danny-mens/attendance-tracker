<?php
session_start();
header('Content-Type: application/json');
echo json_encode([
    'loggedIn' => isset($_SESSION['user_id']),
    'username' => $_SESSION['username'] ?? null,
    'name'     => $_SESSION['full_name'] ?? ($_SESSION['username'] ?? null)
]);