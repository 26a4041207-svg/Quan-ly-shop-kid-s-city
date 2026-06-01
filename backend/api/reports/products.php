<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$stmt = db()->query(
    'SELECT p.code, p.name, c.name AS category_name, p.stock,
            COALESCE(SUM(d.quantity), 0) AS sold_quantity,
            COALESCE(SUM(d.line_total), 0) AS revenue
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN invoice_details d ON d.product_id = p.id
     GROUP BY p.id, p.code, p.name, c.name, p.stock
     ORDER BY sold_quantity DESC'
);

ok($stmt->fetchAll());
