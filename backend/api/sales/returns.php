<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

if ($method === 'GET') {
    current_user();
    $stmt = db()->query(
        'SELECT 
            r.maTraHang AS id, 
            CONCAT("TH", LPAD(r.maTraHang, 3, "0")) AS code,
            r.maHoaDon AS invoice_id,
            d.maSanPham AS product_id,
            r.maNguoiDung AS staff_id,
            r.ngayTra AS return_date,
            r.ngayCapNhat AS updated_at,
            d.soLuongTra AS quantity,
            r.tongTienHoan AS refund_amount,
            r.lyDo AS reason,
            "Hoàn thành" AS status,
            CONCAT("HD", LPAD(i.maHoaDon, 3, "0")) AS invoice_code, 
            p.tenSanPham AS product_name, 
            u.tenNguoiDung AS staff_name
         FROM TraHang r
         LEFT JOIN ChiTietTraHang d ON d.maTraHang = r.maTraHang
         LEFT JOIN HoaDon i ON i.maHoaDon = r.maHoaDon
         LEFT JOIN SanPham p ON p.maSanPham = d.maSanPham
         LEFT JOIN NguoiDung u ON u.maNguoiDung = r.maNguoiDung
         ORDER BY r.maTraHang DESC'
    );
    ok($stmt->fetchAll());
}

if ($method === 'POST') {
    $user = current_user();
    $data = input();
    require_fields($data, ['invoice_id', 'product_id']);

    $quantity = max(1, (int) ($data['quantity'] ?? 1));
    $refundAmount = (float) ($data['refund_amount'] ?? 0);
    if ($refundAmount <= 0) {
        $product = db()->prepare('SELECT donGia FROM ChiTietHoaDon WHERE maHoaDon = ? AND maSanPham = ?');
        $product->execute([$data['invoice_id'], $data['product_id']]);
        $row = $product->fetch();
        $refundAmount = (float) ($row['donGia'] ?? 0) * $quantity;
    }

    db()->beginTransaction();
    try {
        $stmt = db()->prepare(
            'INSERT INTO TraHang (maHoaDon, maNguoiDung, tongTienHoan, lyDo)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['invoice_id'],
            $user['id'],
            $refundAmount,
            $data['reason'] ?? '',
        ]);
        $returnId = (int) db()->lastInsertId();

        $detailStmt = db()->prepare(
            'INSERT INTO ChiTietTraHang (maTraHang, maSanPham, soLuongTra, thanhTienHoan)
             VALUES (?, ?, ?, ?)'
        );
        $detailStmt->execute([
            $returnId,
            $data['product_id'],
            $quantity,
            $refundAmount
        ]);
        db()->commit();
        ok(['id' => $returnId], 'Tạo phiếu trả hàng thành công');
    } catch (\Throwable $e) {
        db()->rollBack();
        fail('Lỗi tạo phiếu trả hàng: ' . $e->getMessage());
    }
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    require_fields($data, ['id']);
    db()->beginTransaction();
    try {
        if (isset($data['refund_amount'])) {
            $stmt = db()->prepare('UPDATE TraHang SET lyDo = ?, tongTienHoan = ? WHERE maTraHang = ?');
            $stmt->execute([$data['reason'] ?? '', $data['refund_amount'], $data['id']]);
        } else {
            $stmt = db()->prepare('UPDATE TraHang SET lyDo = ? WHERE maTraHang = ?');
            $stmt->execute([$data['reason'] ?? '', $data['id']]);
        }

        if (!empty($data['items']) && is_array($data['items'])) {
            $deleteStmt = db()->prepare('DELETE FROM ChiTietTraHang WHERE maTraHang = ?');
            $deleteStmt->execute([$data['id']]);
            $detailStmt = db()->prepare('INSERT INTO ChiTietTraHang (maTraHang, maSanPham, soLuongTra, thanhTienHoan) VALUES (?, ?, ?, ?)');
            foreach ($data['items'] as $item) {
                if (!empty($item['product_id'])) {
                    $detailStmt->execute([
                        $data['id'],
                        $item['product_id'],
                        max(1, (int) ($item['quantity'] ?? 1)),
                        $item['refund_amount'] ?? 0
                    ]);
                }
            }
        } elseif (!empty($data['product_id']) && !empty($data['quantity']) && isset($data['refund_amount'])) {
            $detailStmt = db()->prepare('UPDATE ChiTietTraHang SET maSanPham = ?, soLuongTra = ?, thanhTienHoan = ? WHERE maTraHang = ?');
            $detailStmt->execute([
                $data['product_id'],
                max(1, (int) $data['quantity']),
                $data['refund_amount'],
                $data['id']
            ]);
        }
        
        db()->commit();
        ok(null, 'Cập nhật phiếu trả hàng thành công');
    } catch (\Throwable $e) {
        db()->rollBack();
        fail('Lỗi cập nhật phiếu trả hàng: ' . $e->getMessage());
    }
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã phiếu trả hàng.', 422);
    db()->beginTransaction();
    try {
        $detailStmt = db()->prepare('DELETE FROM ChiTietTraHang WHERE maTraHang = ?');
        $detailStmt->execute([$id]);
        $stmt = db()->prepare('DELETE FROM TraHang WHERE maTraHang = ?');
        $stmt->execute([$id]);
        db()->commit();
        ok(null, 'Xóa phiếu trả hàng thành công');
    } catch (\Throwable $e) {
        db()->rollBack();
        fail('Lỗi xóa phiếu trả hàng.');
    }
}
