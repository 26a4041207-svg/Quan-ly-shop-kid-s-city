<?php
require 'backend/core/bootstrap.php';
$stmt = db()->query('DESCRIBE users');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
