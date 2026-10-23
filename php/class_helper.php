<?php
// Finds this lecturer's class by name, or creates it. Empty name means no class.
function class_id_for(PDO $pdo, int $userId, string $name): ?int {
    $name = trim($name);
    if ($name === '') {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id FROM classes WHERE user_id = ? AND class_name = ?');
    $stmt->execute([$userId, $name]);
    $id = $stmt->fetchColumn();
    if ($id !== false) {
        return (int)$id;
    }

    $stmt = $pdo->prepare('INSERT INTO classes (user_id, class_name) VALUES (?, ?)');
    $stmt->execute([$userId, $name]);
    return (int)$pdo->lastInsertId();
}