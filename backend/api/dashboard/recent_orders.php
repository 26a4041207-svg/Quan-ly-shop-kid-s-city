<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$limit = max(1, min(20, (int) ($_GET['limit'] ?? 10)));
$stmt = db()->prepare(
    'SELECT CONCAT("HD", LPAD(i.maHoaDon, 3, "0")) AS code, i.ngayTao AS invoice_date, i.tongTien AS total, c.tenKhachHang AS customer_name
     FROM HoaDon i
     LEFT JOIN KhachHang c ON c.maKhachHang = i.maKhachHang
     ORDER BY i.maHoaDon DESC
     LIMIT ?'
);
$stmt->bindValue(1, $limit, PDO::PARAM_INT);
$stmt->execute();

ok($stmt->fetchAll());
