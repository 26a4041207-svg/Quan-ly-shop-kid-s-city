<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$today = date('Y-m-d');
$revenue = db()->prepare('SELECT COALESCE(SUM(tongTien), 0) AS value FROM HoaDon WHERE DATE(ngayTao) = ?');
$revenue->execute([$today]);

$orders = db()->prepare('SELECT COUNT(*) AS value FROM HoaDon WHERE DATE(ngayTao) = ?');
$orders->execute([$today]);

$customers = db()->query('SELECT COUNT(*) AS value FROM KhachHang');
$products = db()->query('SELECT COUNT(*) AS value FROM SanPham');

ok([
    'todayRevenue' => (float) $revenue->fetch()['value'],
    'todayOrders' => (int) $orders->fetch()['value'],
    'customers' => (int) $customers->fetch()['value'],
    'products' => (int) $products->fetch()['value'],
]);
