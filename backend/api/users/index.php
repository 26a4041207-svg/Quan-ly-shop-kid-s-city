<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

if ($method === 'GET') {
    current_user();
    $keyword = trim((string) ($_GET['q'] ?? ''));
    if ($keyword !== '') {
        $like = '%' . $keyword . '%';
        $stmt = db()->prepare(
            'SELECT * FROM users
             WHERE name LIKE ? OR username LIKE ? OR email LIKE ? OR phone LIKE ?
             ORDER BY id DESC'
        );
        $stmt->execute([$like, $like, $like, $like]);
    } else {
        $stmt = db()->query('SELECT * FROM users ORDER BY id DESC');
    }
    ok(array_map('public_user', $stmt->fetchAll()));
}

if ($method === 'POST') {
    require_admin();
    $data = input();
    require_fields($data, ['name', 'username', 'password']);

    $role = ($data['role'] ?? 'staff') === 'admin' ? 'admin' : 'staff';
    $status = $data['status'] ?? 'Chưa kích hoạt';

    try {
        $stmt = db()->prepare(
            'INSERT INTO users (username, password_hash, name, email, phone, cccd, address, role, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['username'],
            password_hash((string) $data['password'], PASSWORD_DEFAULT),
            $data['name'],
            $data['email'] ?? '',
            $data['phone'] ?? $data['username'],
            $data['cccd'] ?? '',
            $data['address'] ?? '',
            $role,
            $status,
        ]);
    } catch (PDOException $exception) {
        fail('Tên đăng nhập hoặc số điện thoại đã tồn tại.', 409);
    }

    $user = db()->query('SELECT * FROM users WHERE id = LAST_INSERT_ID()')->fetch();
    ok(public_user($user), 'Thêm người dùng thành công');
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    require_fields($data, ['id', 'name', 'username']);

    $role = ($data['role'] ?? 'staff') === 'admin' ? 'admin' : 'staff';
    $status = $data['status'] ?? 'Đã kích hoạt';

    $stmt = db()->prepare(
        'UPDATE users
         SET username = ?, name = ?, email = ?, phone = ?, cccd = ?, address = ?, role = ?, status = ?, updated_at = NOW()
         WHERE id = ?'
    );
    $stmt->execute([
        $data['username'],
        $data['name'],
        $data['email'] ?? '',
        $data['phone'] ?? $data['username'],
        $data['cccd'] ?? '',
        $data['address'] ?? '',
        $role,
        $status,
        $data['id'],
    ]);

    $select = db()->prepare('SELECT * FROM users WHERE id = ?');
    $select->execute([$data['id']]);
    ok(public_user($select->fetch()), 'Cập nhật người dùng thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        fail('Thiếu mã người dùng.', 422);
    }

    $stmt = db()->prepare('DELETE FROM users WHERE id = ? AND role <> "admin"');
    $stmt->execute([$id]);
    ok(null, 'Xóa người dùng thành công');
}
