<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

if ($method === 'GET') {
    current_user();
    $keyword = trim((string) ($_GET['q'] ?? ''));
    if ($keyword !== '') {
        $like = '%' . $keyword . '%';
        $stmt = db()->prepare('SELECT 
            maKhachHang AS id,
            CONCAT("KH", LPAD(maKhachHang, 3, "0")) AS code,
            tenKhachHang AS name,
            soDienThoai AS phone,
            "" AS email,
            "" AS address,
            "" AS gender,
            NULL AS birthday,
            "" AS note,
            ngayTao AS created_at,
            ngayCapNhat AS updated_at
        FROM KhachHang WHERE tenKhachHang LIKE ? OR soDienThoai LIKE ? ORDER BY maKhachHang DESC');
        $stmt->execute([$like, $like]);
    } else {
        $stmt = db()->query('SELECT 
            maKhachHang AS id,
            CONCAT("KH", LPAD(maKhachHang, 3, "0")) AS code,
            tenKhachHang AS name,
            soDienThoai AS phone,
            "" AS email,
            "" AS address,
            "" AS gender,
            NULL AS birthday,
            "" AS note,
            ngayTao AS created_at,
            ngayCapNhat AS updated_at
        FROM KhachHang ORDER BY maKhachHang DESC');
    }
    ok($stmt->fetchAll());
}

if ($method === 'POST') {
    current_user();
    $data = input();
    require_fields($data, ['name', 'phone']);

    try {
        $stmt = db()->prepare(
            'INSERT INTO KhachHang (tenKhachHang, soDienThoai)
             VALUES (?, ?)'
        );
        $stmt->execute([
            $data['name'],
            $data['phone'],
        ]);

        ok(['id' => (int) db()->lastInsertId()], 'Thêm khách hàng thành công');
    } catch (\Throwable $e) {
        if ($e instanceof \PDOException && $e->getCode() === '23000') {
            fail('Số điện thoại hoặc mã khách hàng đã tồn tại.');
        } else {
            fail('Lỗi cơ sở dữ liệu: ' . $e->getMessage());
        }
    }
}

if ($method === 'PUT') {
    current_user();
    $data = input();
    require_fields($data, ['id', 'name', 'phone']);

    try {
        $stmt = db()->prepare(
            'UPDATE KhachHang SET tenKhachHang = ?, soDienThoai = ?, ngayCapNhat = NOW()
             WHERE maKhachHang = ?'
        );
        $stmt->execute([
            $data['name'],
            $data['phone'],
            $data['id'],
        ]);

        ok(null, 'Cập nhật khách hàng thành công');
    } catch (\Throwable $e) {
        if ($e instanceof \PDOException && $e->getCode() === '23000') {
            fail('Số điện thoại hoặc mã khách hàng đã tồn tại.');
        } else {
            fail('Lỗi cơ sở dữ liệu: ' . $e->getMessage());
        }
    }
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã khách hàng.', 422);
    $stmt = db()->prepare('DELETE FROM KhachHang WHERE maKhachHang = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa khách hàng thành công');
}
