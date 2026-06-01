<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

if ($method === 'GET') {
    current_user();
    $stmt = db()->query('SELECT * FROM categories ORDER BY id DESC');
    ok($stmt->fetchAll());
}

if ($method === 'POST') {
    require_admin();
    $data = input();
    require_fields($data, ['name']);

    $stmt = db()->prepare('INSERT INTO categories (code, name, description, status) VALUES (?, ?, ?, ?)');
    $stmt->execute([
        $data['code'] ?? null,
        $data['name'],
        $data['description'] ?? '',
        $data['status'] ?? 'Đang bán',
    ]);

    ok(['id' => (int) db()->lastInsertId()], 'Thêm danh mục thành công');
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    require_fields($data, ['id', 'name']);

    $stmt = db()->prepare('UPDATE categories SET code = ?, name = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([
        $data['code'] ?? null,
        $data['name'],
        $data['description'] ?? '',
        $data['status'] ?? 'Đang bán',
        $data['id'],
    ]);

    ok(null, 'Cập nhật danh mục thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã danh mục.', 422);
    $stmt = db()->prepare('DELETE FROM categories WHERE id = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa danh mục thành công');
}
