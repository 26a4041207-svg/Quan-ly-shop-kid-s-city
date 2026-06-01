<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

if ($method === 'GET') {
    current_user();
    $keyword = trim((string) ($_GET['q'] ?? ''));
    $sql = 'SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id';
    $params = [];

    if ($keyword !== '') {
        $sql .= ' WHERE p.code LIKE ? OR p.name LIKE ? OR c.name LIKE ? OR p.color LIKE ? OR p.size LIKE ?';
        $like = '%' . $keyword . '%';
        $params = [$like, $like, $like, $like, $like];
    }

    $sql .= ' ORDER BY p.id DESC';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    ok($stmt->fetchAll());
}

if ($method === 'POST') {
    require_admin();
    $data = input();
    require_fields($data, ['name', 'price']);

    $stmt = db()->prepare(
        'INSERT INTO products (code, category_id, name, size, color, price, import_price, stock, image, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $data['code'] ?? null,
        $data['category_id'] ?? null,
        $data['name'],
        $data['size'] ?? '',
        $data['color'] ?? '',
        $data['price'],
        $data['import_price'] ?? 0,
        $data['stock'] ?? 0,
        $data['image'] ?? '',
        $data['status'] ?? 'Đang bán',
    ]);

    ok(['id' => (int) db()->lastInsertId()], 'Thêm sản phẩm thành công');
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    require_fields($data, ['id', 'name', 'price']);

    $stmt = db()->prepare(
        'UPDATE products
         SET code = ?, category_id = ?, name = ?, size = ?, color = ?, price = ?, import_price = ?, stock = ?, image = ?, status = ?, updated_at = NOW()
         WHERE id = ?'
    );
    $stmt->execute([
        $data['code'] ?? null,
        $data['category_id'] ?? null,
        $data['name'],
        $data['size'] ?? '',
        $data['color'] ?? '',
        $data['price'],
        $data['import_price'] ?? 0,
        $data['stock'] ?? 0,
        $data['image'] ?? '',
        $data['status'] ?? 'Đang bán',
        $data['id'],
    ]);

    ok(null, 'Cập nhật sản phẩm thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã sản phẩm.', 422);
    $stmt = db()->prepare('DELETE FROM products WHERE id = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa sản phẩm thành công');
}
