<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$limit = max(1, min(20, (int) ($_GET['limit'] ?? 5)));
$stmt = db()->prepare(
    'SELECT p.code, p.name, SUM(d.quantity) AS sold_quantity, SUM(d.line_total) AS revenue
     FROM invoice_details d
     INNER JOIN products p ON p.id = d.product_id
     GROUP BY p.id, p.code, p.name
     ORDER BY sold_quantity DESC
     LIMIT ?'
);
$stmt->bindValue(1, $limit, PDO::PARAM_INT);
$stmt->execute();

ok($stmt->fetchAll());
