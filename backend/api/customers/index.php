<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

if ($method === 'GET') {
    current_user();
    $keyword = trim((string) ($_GET['q'] ?? ''));
    if ($keyword !== '') {
        $like = '%' . $keyword . '%';
        $stmt = db()->prepare('SELECT * FROM customers WHERE code LIKE ? OR name LIKE ? OR phone LIKE ? ORDER BY id DESC');
        $stmt->execute([$like, $like, $like]);
    } else {
        $stmt = db()->query('SELECT * FROM customers ORDER BY id DESC');
    }
    ok($stmt->fetchAll());
}

if ($method === 'POST') {
    current_user();
    $data = input();
    require_fields($data, ['name', 'phone']);

    $stmt = db()->prepare(
        'INSERT INTO customers (code, name, phone, email, address, gender, birthday, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $data['code'] ?? null,
        $data['name'],
        $data['phone'],
        $data['email'] ?? '',
        $data['address'] ?? '',
        $data['gender'] ?? '',
        $data['birthday'] ?? null,
        $data['note'] ?? '',
    ]);

    ok(['id' => (int) db()->lastInsertId()], 'Thêm khách hàng thành công');
}

if ($method === 'PUT') {
    current_user();
    $data = input();
    require_fields($data, ['id', 'name', 'phone']);

    $stmt = db()->prepare(
        'UPDATE customers SET code = ?, name = ?, phone = ?, email = ?, address = ?, gender = ?, birthday = ?, note = ?, updated_at = NOW()
         WHERE id = ?'
    );
    $stmt->execute([
        $data['code'] ?? null,
        $data['name'],
        $data['phone'],
        $data['email'] ?? '',
        $data['address'] ?? '',
        $data['gender'] ?? '',
        $data['birthday'] ?? null,
        $data['note'] ?? '',
        $data['id'],
    ]);

    ok(null, 'Cập nhật khách hàng thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã khách hàng.', 422);
    $stmt = db()->prepare('DELETE FROM customers WHERE id = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa khách hàng thành công');
}
