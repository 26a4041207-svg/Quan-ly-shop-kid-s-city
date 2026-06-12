<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

if ($method === 'GET') {
    current_user();
    $keyword = trim((string) ($_GET['q'] ?? ''));
    $sql = 'SELECT 
                p.maSanPham AS id,
                CONCAT("SP", LPAD(p.maSanPham, 3, "0")) AS code,
                p.maDanhMuc AS category_id,
                p.tenSanPham AS name,
                p.size AS size,
                p.mauSac AS color,
                p.giaBan AS price,
                0 AS import_price,
                p.soLuong AS stock,
                p.anh AS image,
                "Đang bán" AS status,
                p.ngayTao AS created_at,
                p.ngayCapNhat AS updated_at,
                c.tenDanhMuc AS category_name
            FROM SanPham p
            LEFT JOIN DanhMucSP c ON c.maDanhMuc = p.maDanhMuc';
    $params = [];

    if ($keyword !== '') {
        $sql .= ' WHERE p.tenSanPham LIKE ? OR c.tenDanhMuc LIKE ? OR p.mauSac LIKE ? OR p.size LIKE ?';
        $like = '%' . $keyword . '%';
        $params = [$like, $like, $like, $like];
    }

    $sql .= ' ORDER BY p.maSanPham DESC';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    ok($stmt->fetchAll());
}

function saveBase64ImageProduct($base64String) {
    if (!$base64String || strpos($base64String, 'data:image/') !== 0) return '';
    $parts = explode(';', $base64String);
    if (count($parts) < 2) return '';
    $base64Data = explode(',', $parts[1])[1] ?? '';
    $decodedData = base64_decode($base64Data);
    if ($decodedData === false) return '';
    if (strlen($decodedData) > 5 * 1024 * 1024) return '';
    
    $filename = 'product_' . time() . '_' . uniqid() . '.jpg';
    $dir = __DIR__ . '/../../uploads/products';
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    
    file_put_contents($dir . '/' . $filename, $decodedData);
    return 'backend/uploads/products/' . $filename;
}

if ($method === 'POST') {
    current_user();
    $data = input();
    require_fields($data, ['name', 'price']);

    $imagePath = $data['image'] ?? '';
    if (strpos($imagePath, 'data:image/') === 0) {
        $saved = saveBase64ImageProduct($imagePath);
        if ($saved) $imagePath = $saved;
    }

    $stmt = db()->prepare(
        'INSERT INTO SanPham (maDanhMuc, tenSanPham, size, mauSac, giaBan, soLuong, anh)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $data['category_id'] ?? null,
        $data['name'],
        $data['size'] ?? '',
        $data['color'] ?? '',
        $data['price'],
        $data['stock'] ?? 0,
        $imagePath,
    ]);

    ok(['id' => (int) db()->lastInsertId()], 'Thêm sản phẩm thành công');
}

if ($method === 'PUT') {
    current_user();
    $data = input();
    require_fields($data, ['id', 'name', 'price']);

    $imagePath = $data['image'] ?? '';
    if (strpos($imagePath, 'data:image/') === 0) {
        $saved = saveBase64ImageProduct($imagePath);
        if ($saved) $imagePath = $saved;
    }

    if ($imagePath === '' && !isset($data['image'])) {
        $stmt = db()->prepare(
            'UPDATE SanPham
             SET maDanhMuc = ?, tenSanPham = ?, size = ?, mauSac = ?, giaBan = ?, soLuong = ?
             WHERE maSanPham = ?'
        );
        $stmt->execute([
            $data['category_id'] ?? null,
            $data['name'],
            $data['size'] ?? '',
            $data['color'] ?? '',
            $data['price'],
            $data['stock'] ?? 0,
            $data['id'],
        ]);
    } else {
        $stmt = db()->prepare(
            'UPDATE SanPham
             SET maDanhMuc = ?, tenSanPham = ?, size = ?, mauSac = ?, giaBan = ?, soLuong = ?, anh = ?
             WHERE maSanPham = ?'
        );
        $stmt->execute([
            $data['category_id'] ?? null,
            $data['name'],
            $data['size'] ?? '',
            $data['color'] ?? '',
            $data['price'],
            $data['stock'] ?? 0,
            $imagePath,
            $data['id'],
        ]);
    }

    ok(null, 'Cập nhật sản phẩm thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã sản phẩm.', 422);
    $stmt = db()->prepare('DELETE FROM SanPham WHERE maSanPham = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa sản phẩm thành công');
}