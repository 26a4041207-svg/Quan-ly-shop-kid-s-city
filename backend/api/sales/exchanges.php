<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

if ($method === 'GET') {
    current_user();
    $stmt = db()->query(
        'SELECT 
            e.maDoiHang AS id, 
            CONCAT("DH", LPAD(e.maDoiHang, 3, "0")) AS code,
            e.maHoaDon AS invoice_id,
            e.maNguoiDung AS staff_id,
            e.ngayDoi AS exchange_date,
            e.ngayCapNhat AS updated_at,
            e.tienBu - e.tienHoan AS refund_amount,
            d.maSanPhamCu AS old_product_id,
            d.maSanPhamMoi AS new_product_id,
            d.soLuong AS quantity,
            e.lyDo AS reason,
            "Đổi hàng" AS type,
            "Hoàn thành" AS status,
            CONCAT("HD", LPAD(i.maHoaDon, 3, "0")) AS invoice_code, 
            u.tenNguoiDung AS staff_name,
            old_p.tenSanPham AS old_product_name, 
            new_p.tenSanPham AS new_product_name
         FROM DoiHang e
         LEFT JOIN ChiTietDoiHang d ON d.maDoiHang = e.maDoiHang
         LEFT JOIN HoaDon i ON i.maHoaDon = e.maHoaDon
         LEFT JOIN SanPham old_p ON old_p.maSanPham = d.maSanPhamCu
         LEFT JOIN SanPham new_p ON new_p.maSanPham = d.maSanPhamMoi
         LEFT JOIN NguoiDung u ON u.maNguoiDung = e.maNguoiDung
         ORDER BY e.maDoiHang DESC'
    );
    ok($stmt->fetchAll());
}

if ($method === 'POST') {
    $user = current_user();
    $data = input();
    require_fields($data, ['invoice_id', 'old_product_id']);

    db()->beginTransaction();
    try {
        $tienBu = $data['exchange_refund'] > 0 ? $data['exchange_refund'] : 0;
        $tienHoan = $data['exchange_refund'] < 0 ? abs($data['exchange_refund']) : 0;

        $stmt = db()->prepare(
            'INSERT INTO DoiHang (maHoaDon, maNguoiDung, lyDo, tienBu, tienHoan)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['invoice_id'],
            $user['id'],
            $data['reason'] ?? '',
            $tienBu,
            $tienHoan
        ]);
        $exchangeId = (int) db()->lastInsertId();

        $detailStmt = db()->prepare(
            'INSERT INTO ChiTietDoiHang (maDoiHang, maSanPhamCu, maSanPhamMoi, soLuong)
             VALUES (?, ?, ?, ?)'
        );
        $detailStmt->execute([
            $exchangeId,
            $data['old_product_id'],
            $data['new_product_id'] ?? null,
            max(1, (int) ($data['quantity'] ?? 1)),
        ]);
        db()->commit();
        ok(['id' => $exchangeId], 'Tạo phiếu đổi hàng thành công');
    } catch (\Throwable $e) {
        db()->rollBack();
        fail('Lỗi tạo phiếu đổi hàng: ' . $e->getMessage());
    }
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    require_fields($data, ['id']);
    db()->beginTransaction();
    try {
        if (isset($data['exchange_refund'])) {
            $tienBu = $data['exchange_refund'] > 0 ? $data['exchange_refund'] : 0;
            $tienHoan = $data['exchange_refund'] < 0 ? abs($data['exchange_refund']) : 0;
            
            $stmt = db()->prepare('UPDATE DoiHang SET lyDo = ?, tienBu = ?, tienHoan = ? WHERE maDoiHang = ?');
            $stmt->execute([$data['reason'] ?? '', $tienBu, $tienHoan, $data['id']]);
        } else {
            $stmt = db()->prepare('UPDATE DoiHang SET lyDo = ? WHERE maDoiHang = ?');
            $stmt->execute([$data['reason'] ?? '', $data['id']]);
        }

        if (!empty($data['items']) && is_array($data['items'])) {
            $deleteStmt = db()->prepare('DELETE FROM ChiTietDoiHang WHERE maDoiHang = ?');
            $deleteStmt->execute([$data['id']]);
            $detailStmt = db()->prepare('INSERT INTO ChiTietDoiHang (maDoiHang, maSanPhamCu, maSanPhamMoi, soLuong) VALUES (?, ?, ?, ?)');
            foreach ($data['items'] as $item) {
                if (!empty($item['old_product_id'])) {
                    $detailStmt->execute([
                        $data['id'],
                        $item['old_product_id'],
                        $item['new_product_id'] ?? null,
                        max(1, (int) ($item['quantity'] ?? 1))
                    ]);
                }
            }
        } elseif (!empty($data['old_product_id']) && !empty($data['quantity'])) {
            $detailStmt = db()->prepare('UPDATE ChiTietDoiHang SET maSanPhamCu = ?, maSanPhamMoi = ?, soLuong = ? WHERE maDoiHang = ?');
            $detailStmt->execute([
                $data['old_product_id'],
                $data['new_product_id'] ?? null,
                max(1, (int) ($data['quantity'] ?? 1)),
                $data['id']
            ]);
        }
        
        db()->commit();
        ok(null, 'Cập nhật phiếu đổi hàng thành công');
    } catch (\Throwable $e) {
        db()->rollBack();
        fail('Lỗi cập nhật phiếu đổi hàng: ' . $e->getMessage());
    }
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã phiếu đổi hàng.', 422);
    db()->beginTransaction();
    try {
        $detailStmt = db()->prepare('DELETE FROM ChiTietDoiHang WHERE maDoiHang = ?');
        $detailStmt->execute([$id]);
        $stmt = db()->prepare('DELETE FROM DoiHang WHERE maDoiHang = ?');
        $stmt->execute([$id]);
        db()->commit();
        ok(null, 'Xóa phiếu đổi hàng thành công');
    } catch (\Throwable $e) {
        db()->rollBack();
        fail('Lỗi xóa phiếu đổi hàng.');
    }
}
