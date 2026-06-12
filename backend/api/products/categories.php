<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

function next_category_code(): string
{
    $stmt = db()->query("SELECT code FROM categories WHERE code LIKE 'DM%' ORDER BY id DESC LIMIT 1");
    $row = $stmt->fetch();
    $last = $row ? (string) ($row['code'] ?? '') : '';
    $number = (int) preg_replace('/\D+/', '', $last);
    if ($number === 0) {
        $stmt2 = db()->query("SELECT COUNT(*) as cnt FROM categories");
        $row2 = $stmt2->fetch();
        $number = $row2 ? (int) ($row2['cnt'] ?? 0) : 0;
    }
    return 'DM' . str_pad((string) ($number + 1), 3, '0', STR_PAD_LEFT);
}

if ($method === 'GET') {
    current_user();
    $stmt = db()->query('SELECT * FROM categories ORDER BY id DESC');
    ok($stmt->fetchAll());
}

if ($method === 'POST') {
    current_user();
    $data = input();
    require_fields($data, ['name']);

    $code = trim((string) ($data['code'] ?? ''));
    if ($code === '') {
        $code = next_category_code();
    }

    $stmt = db()->prepare('INSERT INTO categories (code, name, description, status) VALUES (?, ?, ?, ?)');
    $stmt->execute([
        $code,
        $data['name'],
        $data['description'] ?? '',
        $data['status'] ?? 'Đang bán',
    ]);

    ok(['id' => (int) db()->lastInsertId()], 'Thêm danh mục thành công');
}

if ($method === 'PUT') {
    current_user();
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
