<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

function next_exchange_code(): string
{
    $stmt = db()->query('SELECT code FROM exchanges ORDER BY id DESC LIMIT 1');
    $last = (string) ($stmt->fetch()['code'] ?? '');
    $number = (int) preg_replace('/\D+/', '', $last);
    return 'DH' . str_pad((string) ($number + 1), 3, '0', STR_PAD_LEFT);
}

if ($method === 'GET') {
    current_user();
    $stmt = db()->query(
        'SELECT e.*, i.code AS invoice_code, u.name AS staff_name,
                old_p.name AS old_product_name, new_p.name AS new_product_name
         FROM exchanges e
         LEFT JOIN invoices i ON i.id = e.invoice_id
         LEFT JOIN products old_p ON old_p.id = e.old_product_id
         LEFT JOIN products new_p ON new_p.id = e.new_product_id
         LEFT JOIN users u ON u.id = e.staff_id
         ORDER BY e.id DESC'
    );
    ok($stmt->fetchAll());
}

if ($method === 'POST') {
    $user = current_user();
    $data = input();
    require_fields($data, ['invoice_id', 'old_product_id']);

    $stmt = db()->prepare(
        'INSERT INTO exchanges (code, invoice_id, staff_id, exchange_date, old_product_id, new_product_id, quantity, reason, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $data['code'] ?? next_exchange_code(),
        $data['invoice_id'],
        $user['id'],
        $data['exchange_date'] ?? date('Y-m-d'),
        $data['old_product_id'],
        $data['new_product_id'] ?? null,
        max(1, (int) ($data['quantity'] ?? 1)),
        $data['reason'] ?? '',
        $data['type'] ?? 'Đổi hàng',
    ]);

    ok(['id' => (int) db()->lastInsertId()], 'Tạo phiếu đổi hàng thành công');
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    require_fields($data, ['id']);
    $stmt = db()->prepare('UPDATE exchanges SET reason = ?, status = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$data['reason'] ?? '', $data['status'] ?? 'Hoàn thành', $data['id']]);
    ok(null, 'Cập nhật phiếu đổi hàng thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã phiếu đổi hàng.', 422);
    $stmt = db()->prepare('DELETE FROM exchanges WHERE id = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa phiếu đổi hàng thành công');
}
