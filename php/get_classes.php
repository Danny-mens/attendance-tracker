<?php
require 'db.php';
require 'auth.php';

$sql = "SELECT c.id, c.class_name, c.level, COUNT(s.id) AS student_count
        FROM classes c
        LEFT JOIN students s ON s.class_id = c.id
        GROUP BY c.id, c.class_name, c.level
        ORDER BY c.class_name";

echo json_encode($pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC));