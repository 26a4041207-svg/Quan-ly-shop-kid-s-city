<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$limit = max(1, min(20, (int) ($_GET['limit'] ?? 10)));
$stmt = db()->prepare(
    'SELECT i.code, i.invoice_date, i.total, c.name AS customer_name
     FROM invoices i
     LEFT JOIN customers c ON c.id = i.customer_id
     ORDER BY i.id DESC
     LIMIT ?'
);
$stmt->bindValue(1, $limit, PDO::PARAM_INT);
$stmt->execute();

ok($stmt->fetchAll());
