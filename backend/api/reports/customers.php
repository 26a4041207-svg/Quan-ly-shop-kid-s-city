<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$stmt = db()->query(
    'SELECT c.code, c.name, c.phone,
            COUNT(i.id) AS order_count,
            COALESCE(SUM(i.total), 0) AS total_spent
     FROM customers c
     LEFT JOIN invoices i ON i.customer_id = c.id
     GROUP BY c.id, c.code, c.name, c.phone
     ORDER BY total_spent DESC'
);

ok($stmt->fetchAll());
