<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

if ($method === 'GET') {
    current_user();
    $stmt = db()->query(
        'SELECT 
            i.maHoaDon AS id,
            CONCAT("HD", LPAD(i.maHoaDon, 3, "0")) AS code,
            i.maKhachHang AS customer_id,
            i.maNguoiDung AS staff_id,
            i.ngayTao AS invoice_date,
            i.ghiChu AS note,
            COALESCE((SELECT SUM(giamGia) FROM ChiTietHoaDon WHERE maHoaDon = i.maHoaDon), 0) AS discount,
            i.tongTien AS total,
            "Hoàn thành" AS status,
            i.ngayTao AS created_at,
            i.ngayCapNhat AS updated_at,
            c.tenKhachHang AS customer_name,
            u.tenNguoiDung AS staff_name
         FROM HoaDon i
         LEFT JOIN KhachHang c ON c.maKhachHang = i.maKhachHang
         LEFT JOIN NguoiDung u ON u.maNguoiDung = i.maNguoiDung
         ORDER BY i.maHoaDon DESC'
    );
    $invoices = $stmt->fetchAll();

    foreach ($invoices as &$invoice) {
        $items = db()->prepare(
            'SELECT 
                d.maHoaDon AS invoice_id,
                d.maSanPham AS product_id,
                d.soLuong AS quantity,
                d.donGia AS price,
                d.giamGia AS discount,
                d.thanhTien AS line_total,
                CONCAT("SP", LPAD(p.maSanPham, 3, "0")) AS product_code,
                p.tenSanPham AS product_name
             FROM ChiTietHoaDon d
             LEFT JOIN SanPham p ON p.maSanPham = d.maSanPham
             WHERE d.maHoaDon = ?'
        );
        $items->execute([$invoice['id']]);
        $invoice['items'] = $items->fetchAll();
    }

    ok($invoices);
}

if ($method === 'POST') {
    $user = current_user();
    $data = input();
    require_fields($data, ['customer_id', 'items']);

    $items = is_array($data['items']) ? $data['items'] : [];
    if (!$items) fail('Vui lòng thêm ít nhất một sản phẩm.', 422);

    db()->beginTransaction();
    try {
        $discount = (float) ($data['discount'] ?? 0);
        $total = 0;
        $preparedItems = [];

        foreach ($items as $item) {
            $productId = (int) ($item['product_id'] ?? 0);
            $quantity = max(1, (int) ($item['quantity'] ?? 1));
            $product = db()->prepare('SELECT maSanPham, giaBan, soLuong FROM SanPham WHERE maSanPham = ?');
            $product->execute([$productId]);
            $row = $product->fetch();
            if (!$row) fail('Sản phẩm không tồn tại.', 422);

            $price = (float) ($item['price'] ?? $row['giaBan']);
            $lineDiscount = (float) ($item['discount'] ?? 0);
            $lineTotal = max(0, $price * $quantity - $lineDiscount);
            $total += $lineTotal;
            $preparedItems[] = [$productId, $quantity, $price, $lineDiscount, $lineTotal];
        }

        $grandTotal = max(0, $total - $discount);
        
        $stmt = db()->prepare(
            'INSERT INTO HoaDon (maKhachHang, maNguoiDung, ghiChu, tongTien)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['customer_id'] ?: null,
            $user['id'],
            $data['note'] ?? '',
            $grandTotal,
        ]);

        $invoiceId = (int) db()->lastInsertId();
        $code = 'HD' . str_pad((string) $invoiceId, 3, '0', STR_PAD_LEFT);
        
        $detail = db()->prepare(
            'INSERT INTO ChiTietHoaDon (maHoaDon, maSanPham, soLuong, donGia, giamGia, thanhTien)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stock = db()->prepare('UPDATE SanPham SET soLuong = GREATEST(soLuong - ?, 0), ngayCapNhat = NOW() WHERE maSanPham = ?');
        foreach ($preparedItems as $item) {
            $detail->execute([$invoiceId, $item[0], $item[1], $item[2], $item[3], $item[4]]);
            $stock->execute([$item[1], $item[0]]);
        }

        db()->commit();
        ok(['id' => $invoiceId, 'code' => $code], 'Tạo hóa đơn thành công');
    } catch (Throwable $exception) {
        db()->rollBack();
        fail('Không thể tạo hóa đơn.', 500, $exception->getMessage());
    }
}

if ($method === 'PUT') {
    $data = input();
    require_fields($data, ['id', 'items']);
    
    $items = is_array($data['items']) ? $data['items'] : [];
    if (!$items) fail('Vui lòng thêm ít nhất một sản phẩm.', 422);
    
    db()->beginTransaction();
    try {
        $discount = (float) ($data['discount'] ?? 0);
        $total = 0;
        $preparedItems = [];
        
        foreach ($items as $item) {
            $productId = (int) ($item['product_id'] ?? 0);
            $quantity = max(1, (int) ($item['quantity'] ?? 1));
            $product = db()->prepare('SELECT maSanPham, giaBan FROM SanPham WHERE maSanPham = ?');
            $product->execute([$productId]);
            $row = $product->fetch();
            if (!$row) fail('Sản phẩm không tồn tại.', 422);
            
            $price = (float) ($item['price'] ?? $row['giaBan']);
            $lineDiscount = (float) ($item['discount'] ?? 0);
            $lineTotal = max(0, $price * $quantity - $lineDiscount);
            $total += $lineTotal;
            $preparedItems[] = [$productId, $quantity, $price, $lineDiscount, $lineTotal];
        }
        
        $grandTotal = max(0, $total - $discount);
        
        $stmt = db()->prepare('UPDATE HoaDon SET tongTien = ?, ghiChu = ?, ngayCapNhat = NOW() WHERE maHoaDon = ?');
        $stmt->execute([
            $grandTotal,
            $data['note'] ?? '',
            $data['id'],
        ]);
        
        // Hoàn lại số lượng kho cho các sản phẩm cũ (tùy chọn, để đơn giản ta bỏ qua hoặc xử lý nếu cần)
        // Xóa chi tiết cũ
        db()->prepare('DELETE FROM ChiTietHoaDon WHERE maHoaDon = ?')->execute([$data['id']]);
        
        // Thêm chi tiết mới
        $detail = db()->prepare(
            'INSERT INTO ChiTietHoaDon (maHoaDon, maSanPham, soLuong, donGia, giamGia, thanhTien)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        foreach ($preparedItems as $item) {
            $detail->execute([$data['id'], $item[0], $item[1], $item[2], $item[3], $item[4]]);
        }
        
        db()->commit();
        ok(null, 'Cập nhật hóa đơn thành công');
    } catch (Throwable $exception) {
        db()->rollBack();
        fail('Không thể cập nhật hóa đơn.', 500, $exception->getMessage());
    }
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã hóa đơn.', 422);
    $stmt = db()->prepare('DELETE FROM HoaDon WHERE maHoaDon = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa hóa đơn thành công');
}
