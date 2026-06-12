<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['GET']);
current_user();

$stmt = db()->query(
    'SELECT 
        CONCAT("SP", LPAD(p.maSanPham, 3, "0")) AS code, 
        p.tenSanPham AS name, 
        c.tenDanhMuc AS category_name, 
        p.soLuong AS stock,
        COALESCE(SUM(d.soLuong), 0) AS sold_quantity,
        COALESCE(SUM(d.thanhTien), 0) AS revenue
     FROM SanPham p
     LEFT JOIN DanhMucSP c ON c.maDanhMuc = p.maDanhMuc
     LEFT JOIN ChiTietHoaDon d ON d.maSanPham = p.maSanPham
     GROUP BY p.maSanPham, p.tenSanPham, c.tenDanhMuc, p.soLuong
     ORDER BY sold_quantity DESC'
);

ok($stmt->fetchAll());
