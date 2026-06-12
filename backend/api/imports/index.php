<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

function get_or_create_category(string $name): ?int
{
    $name = trim($name);
    if ($name === '') return null;
    
    $stmt = db()->prepare('SELECT maDanhMuc FROM DanhMucSP WHERE tenDanhMuc = ?');
    $stmt->execute([$name]);
    $cat = $stmt->fetch();
    if ($cat) {
        return (int) $cat['maDanhMuc'];
    }
    
    $stmt = db()->prepare('INSERT INTO DanhMucSP (tenDanhMuc) VALUES (?)');
    $stmt->execute([$name]);
    return (int) db()->lastInsertId();
}

if ($method === 'GET') {
    current_user();
    $stmt = db()->query(
        'SELECT 
            r.maHangNhap AS id,
            CONCAT("NH", LPAD(r.maHangNhap, 3, "0")) AS code,
            r.nhaCungCap AS supplier,
            r.maNguoiDung AS staff_id,
            r.ngayNhap AS created_at,
            r.ghiChu AS note,
            (SELECT SUM(d.soLuongNhap * p.giaBan) FROM ChiTietHangNhap d JOIN SanPham p ON p.maSanPham = d.maSanPham WHERE d.maHangNhap = r.maHangNhap) AS total,
            r.ngayCapNhat AS updated_at,
            u.tenNguoiDung AS staff_name
         FROM HangNhap r
         LEFT JOIN NguoiDung u ON u.maNguoiDung = r.maNguoiDung
         ORDER BY r.maHangNhap DESC'
     );
    $receipts = $stmt->fetchAll();

    foreach ($receipts as &$receipt) {
        $items = db()->prepare(
            'SELECT 
                d.maHangNhap AS import_id,
                d.maSanPham AS product_id,
                d.soLuongNhap AS quantity,
                p.giaBan AS price,
                (d.soLuongNhap * p.giaBan) AS line_total,
                CONCAT("SP", LPAD(p.maSanPham, 3, "0")) AS product_code,
                p.tenSanPham AS product_name,
                p.size,
                p.mauSac AS color,
                p.anh AS product_image,
                c.tenDanhMuc AS category_name
             FROM ChiTietHangNhap d
             LEFT JOIN SanPham p ON p.maSanPham = d.maSanPham
             LEFT JOIN DanhMucSP c ON c.maDanhMuc = p.maDanhMuc
             WHERE d.maHangNhap = ?'
        );
        $items->execute([$receipt['id']]);
        $receipt['items'] = $items->fetchAll();
    }

    ok($receipts);
}

if ($method === 'POST') {
    $user = current_user();
    $data = input();
    require_fields($data, ['supplier', 'items']);
    $items = is_array($data['items']) ? $data['items'] : [];
    if (!$items) fail('Vui lòng thêm ít nhất một sản phẩm.', 422);

    db()->beginTransaction();
    try {
        $stmt = db()->prepare(
            'INSERT INTO HangNhap (maNguoiDung, nhaCungCap, ngayNhap, ghiChu)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $user['id'],
            $data['supplier'],
            date('Y-m-d H:i:s'),
            $data['note'] ?? '',
        ]);
        $importId = (int) db()->lastInsertId();

        $detail = db()->prepare(
            'INSERT INTO ChiTietHangNhap (maHangNhap, maSanPham, soLuongNhap)
             VALUES (?, ?, ?)'
        );

        foreach ($items as $item) {
            $name = trim($item['name'] ?? '');
            $size = trim($item['size'] ?? '');
            $color = trim($item['color'] ?? '');
            $qty = max(1, (int) ($item['quantity'] ?? 1));
            $price = (float) ($item['price'] ?? 0); 
            
            $prodStmt = db()->prepare('SELECT maSanPham FROM SanPham WHERE tenSanPham = ? AND size = ? AND mauSac = ?');
            $prodStmt->execute([$name, $size, $color]);
            $prod = $prodStmt->fetch();
            
            $productId = 0;
            if ($prod) {
                $productId = (int) $prod['maSanPham'];
                if (!empty($item['image'])) {
                    $upStmt = db()->prepare('UPDATE SanPham SET soLuong = soLuong + ?, giaBan = ?, anh = ?, ngayCapNhat = NOW() WHERE maSanPham = ?');
                    $upStmt->execute([$qty, $price, $item['image'], $productId]);
                } else {
                    $upStmt = db()->prepare('UPDATE SanPham SET soLuong = soLuong + ?, giaBan = ?, ngayCapNhat = NOW() WHERE maSanPham = ?');
                    $upStmt->execute([$qty, $price, $productId]);
                }
            } else {
                $categoryId = get_or_create_category($item['category_name'] ?? '');
                
                $insStmt = db()->prepare(
                    'INSERT INTO SanPham (maDanhMuc, tenSanPham, size, mauSac, giaBan, soLuong, anh)
                     VALUES (?, ?, ?, ?, ?, ?, ?)'
                );
                $insStmt->execute([
                    $categoryId,
                    $name,
                    $size,
                    $color,
                    $price, 
                    $qty,
                    $item['image'] ?? '',
                ]);
                $productId = (int) db()->lastInsertId();
            }

            $detail->execute([$importId, $productId, $qty]);
        }

        db()->commit();
        ok(['id' => $importId], 'Tạo phiếu nhập hàng thành công');
    } catch (Throwable $exception) {
        db()->rollBack();
        fail('Không thể tạo phiếu nhập hàng.', 500, $exception->getMessage());
    }
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    require_fields($data, ['id', 'supplier']);
    $importId = (int) $data['id'];
    $items = is_array($data['items'] ?? null) ? $data['items'] : [];

    db()->beginTransaction();
    try {
        $oldStmt = db()->prepare('SELECT maSanPham, soLuongNhap FROM ChiTietHangNhap WHERE maHangNhap = ?');
        $oldStmt->execute([$importId]);
        $oldItems = $oldStmt->fetchAll();

        $revertStmt = db()->prepare('UPDATE SanPham SET soLuong = soLuong - ? WHERE maSanPham = ?');
        foreach ($oldItems as $old) {
            if ($old['maSanPham']) {
                $revertStmt->execute([$old['soLuongNhap'], $old['maSanPham']]);
            }
        }

        $deleteStmt = db()->prepare('DELETE FROM ChiTietHangNhap WHERE maHangNhap = ?');
        $deleteStmt->execute([$importId]);

        $detail = db()->prepare(
            'INSERT INTO ChiTietHangNhap (maHangNhap, maSanPham, soLuongNhap)
             VALUES (?, ?, ?)'
        );

        foreach ($items as $item) {
            $name = trim($item['name'] ?? '');
            $size = trim($item['size'] ?? '');
            $color = trim($item['color'] ?? '');
            $qty = max(1, (int) ($item['quantity'] ?? 1));
            $price = (float) ($item['price'] ?? 0);

            $prodStmt = db()->prepare('SELECT maSanPham FROM SanPham WHERE tenSanPham = ? AND size = ? AND mauSac = ?');
            $prodStmt->execute([$name, $size, $color]);
            $prod = $prodStmt->fetch();

            $productId = 0;
            if ($prod) {
                $productId = (int) $prod['maSanPham'];
                if (!empty($item['image'])) {
                    $upStmt = db()->prepare('UPDATE SanPham SET soLuong = soLuong + ?, giaBan = ?, anh = ?, ngayCapNhat = NOW() WHERE maSanPham = ?');
                    $upStmt->execute([$qty, $price, $item['image'], $productId]);
                } else {
                    $upStmt = db()->prepare('UPDATE SanPham SET soLuong = soLuong + ?, giaBan = ?, ngayCapNhat = NOW() WHERE maSanPham = ?');
                    $upStmt->execute([$qty, $price, $productId]);
                }
            } else {
                $categoryId = get_or_create_category($item['category_name'] ?? '');
                $insStmt = db()->prepare(
                    'INSERT INTO SanPham (maDanhMuc, tenSanPham, size, mauSac, giaBan, soLuong, anh)
                     VALUES (?, ?, ?, ?, ?, ?, ?)'
                );
                $insStmt->execute([
                    $categoryId,
                    $name,
                    $size,
                    $color,
                    $price,
                    $qty,
                    $item['image'] ?? '',
                ]);
                $productId = (int) db()->lastInsertId();
            }

            $detail->execute([$importId, $productId, $qty]);
        }

        $stmt = db()->prepare('UPDATE HangNhap SET nhaCungCap = ?, ghiChu = ?, ngayCapNhat = NOW() WHERE maHangNhap = ?');
        $stmt->execute([
            $data['supplier'],
            $data['note'] ?? '',
            $importId,
        ]);

        db()->commit();
        ok(null, 'Cập nhật phiếu nhập hàng thành công');
    } catch (Throwable $exception) {
        db()->rollBack();
        fail('Không thể cập nhật phiếu nhập hàng.', 500, $exception->getMessage());
    }
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã phiếu nhập hàng.', 422);
    $stmt = db()->prepare('DELETE FROM HangNhap WHERE maHangNhap = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa phiếu nhập hàng thành công');
}

