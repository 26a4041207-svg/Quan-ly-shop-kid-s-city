<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$from = $_GET['from'] ?? '1900-01-01';
$to = $_GET['to'] ?? '2999-12-31';

$stmt = db()->prepare(
    'SELECT 
        CONCAT("SP", LPAD(p.maSanPham, 3, "0")) AS code, 
        p.tenSanPham AS name, 
        c.tenDanhMuc AS category_name, 
        p.soLuong AS stock,
        COALESCE(SUM(sold.soLuong), 0) AS sold_quantity
     FROM SanPham p
     LEFT JOIN DanhMucSP c ON c.maDanhMuc = p.maDanhMuc
     LEFT JOIN (
         SELECT d2.maSanPham, d2.soLuong
         FROM ChiTietHoaDon d2
         JOIN HoaDon h2 ON h2.maHoaDon = d2.maHoaDon
         WHERE DATE(h2.ngayTao) BETWEEN ? AND ?
     ) sold ON sold.maSanPham = p.maSanPham
     GROUP BY p.maSanPham, p.tenSanPham, c.tenDanhMuc, p.soLuong
     ORDER BY sold_quantity DESC'
);
$stmt->execute([$from, $to]);

ok($stmt->fetchAll());
