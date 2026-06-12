<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

if ($method === 'GET') {
    current_user();
    $stmt = db()->query('SELECT 
            maDanhMuc AS id, 
            CONCAT("DM", LPAD(maDanhMuc, 3, "0")) AS code, 
            tenDanhMuc AS name, 
            moTa AS description, 
            "Đang bán" AS status, 
            ngayTao AS created_at, 
            ngayCapNhat AS updated_at 
        FROM DanhMucSP ORDER BY maDanhMuc DESC');
    ok($stmt->fetchAll());
}

if ($method === 'POST') {
    current_user();
    $data = input();
    require_fields($data, ['name']);

    $stmt = db()->prepare('INSERT INTO DanhMucSP (tenDanhMuc, moTa) VALUES (?, ?)');
    $stmt->execute([
        $data['name'],
        $data['description'] ?? '',
    ]);

    ok(['id' => (int) db()->lastInsertId()], 'Thêm danh mục thành công');
}

if ($method === 'PUT') {
    current_user();
    $data = input();
    require_fields($data, ['id', 'name']);

    $stmt = db()->prepare('UPDATE DanhMucSP SET tenDanhMuc = ?, moTa = ?, ngayCapNhat = NOW() WHERE maDanhMuc = ?');
    $stmt->execute([
        $data['name'],
        $data['description'] ?? '',
        $data['id'],
    ]);

    ok(null, 'Cập nhật danh mục thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã danh mục.', 422);
    $stmt = db()->prepare('DELETE FROM DanhMucSP WHERE maDanhMuc = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa danh mục thành công');
}
