<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$stmt = db()->query(
    'SELECT 
        CONCAT("KH", LPAD(c.maKhachHang, 3, "0")) AS code, 
        c.tenKhachHang AS name, 
        c.soDienThoai AS phone,
        COUNT(i.maHoaDon) AS order_count,
        COALESCE(SUM(i.tongTien), 0) AS total_spent
     FROM KhachHang c
     LEFT JOIN HoaDon i ON i.maKhachHang = c.maKhachHang
     GROUP BY c.maKhachHang, c.tenKhachHang, c.soDienThoai
     ORDER BY total_spent DESC'
);

ok($stmt->fetchAll());
