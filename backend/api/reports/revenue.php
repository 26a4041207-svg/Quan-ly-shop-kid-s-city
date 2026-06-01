<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$from = $_GET['from'] ?? date('Y-m-01');
$to = $_GET['to'] ?? date('Y-m-d');

$stmt = db()->prepare(
    'SELECT invoice_date, COUNT(*) AS orders, SUM(total) AS revenue
     FROM invoices
     WHERE invoice_date BETWEEN ? AND ?
     GROUP BY invoice_date
     ORDER BY invoice_date'
);
$stmt->execute([$from, $to]);

ok($stmt->fetchAll());
