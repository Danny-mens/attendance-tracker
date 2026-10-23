<?php
// Returns the id of the class with this name, creating it if it does not exist.
// Returns null when the name is empty (the student then has no class).
function class_id_for(PDO $pdo, string $name): ?int {
    $name = trim($name);
    if ($name === '') {
        return null;
    }

    $stmt = $pdo->prepare('SELECT id FROM classes WHERE class_name = ?');
    $stmt->execute([$name]);
    $id = $stmt->fetchColumn();
    if ($id !== false) {
        return (int)$id;
    }

    $stmt = $pdo->prepare('INSERT INTO classes (class_name) VALUES (?)');
    $stmt->execute([$name]);
    return (int)$pdo->lastInsertId();
}