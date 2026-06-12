<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$limit = max(1, min(20, (int) ($_GET['limit'] ?? 5)));
$stmt = db()->prepare(
    'SELECT CONCAT("SP", LPAD(p.maSanPham, 3, "0")) AS code, p.tenSanPham AS name, SUM(d.soLuong) AS sold_quantity, SUM(d.thanhTien) AS revenue
     FROM ChiTietHoaDon d
     INNER JOIN SanPham p ON p.maSanPham = d.maSanPham
     GROUP BY p.maSanPham, p.tenSanPham
     ORDER BY sold_quantity DESC
     LIMIT ?'
);
$stmt->bindValue(1, $limit, PDO::PARAM_INT);
$stmt->execute();

ok($stmt->fetchAll());
