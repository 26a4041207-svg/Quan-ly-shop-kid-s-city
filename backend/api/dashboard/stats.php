<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$today = date('Y-m-d');
$revenue = db()->prepare('SELECT COALESCE(SUM(total), 0) AS value FROM invoices WHERE invoice_date = ?');
$revenue->execute([$today]);

$orders = db()->prepare('SELECT COUNT(*) AS value FROM invoices WHERE invoice_date = ?');
$orders->execute([$today]);

$customers = db()->query('SELECT COUNT(*) AS value FROM customers');
$products = db()->query('SELECT COUNT(*) AS value FROM products');

ok([
    'todayRevenue' => (float) $revenue->fetch()['value'],
    'todayOrders' => (int) $orders->fetch()['value'],
    'customers' => (int) $customers->fetch()['value'],
    'products' => (int) $products->fetch()['value'],
]);
