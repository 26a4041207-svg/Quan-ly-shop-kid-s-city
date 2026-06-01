<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

function next_return_code(): string
{
    $stmt = db()->query('SELECT code FROM returns ORDER BY id DESC LIMIT 1');
    $last = (string) ($stmt->fetch()['code'] ?? '');
    $number = (int) preg_replace('/\D+/', '', $last);
    return 'TH' . str_pad((string) ($number + 1), 3, '0', STR_PAD_LEFT);
}

if ($method === 'GET') {
    current_user();
    $stmt = db()->query(
        'SELECT r.*, i.code AS invoice_code, p.name AS product_name, u.name AS staff_name
         FROM returns r
         LEFT JOIN invoices i ON i.id = r.invoice_id
         LEFT JOIN products p ON p.id = r.product_id
         LEFT JOIN users u ON u.id = r.staff_id
         ORDER BY r.id DESC'
    );
    ok($stmt->fetchAll());
}

if ($method === 'POST') {
    $user = current_user();
    $data = input();
    require_fields($data, ['invoice_id', 'product_id']);

    $quantity = max(1, (int) ($data['quantity'] ?? 1));
    $refundAmount = (float) ($data['refund_amount'] ?? 0);
    if ($refundAmount <= 0) {
        $product = db()->prepare('SELECT price FROM products WHERE id = ?');
        $product->execute([$data['product_id']]);
        $refundAmount = (float) ($product->fetch()['price'] ?? 0) * $quantity;
    }

    $stmt = db()->prepare(
        'INSERT INTO returns (code, invoice_id, product_id, staff_id, return_date, quantity, refund_amount, reason, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $data['code'] ?? next_return_code(),
        $data['invoice_id'],
        $data['product_id'],
        $user['id'],
        $data['return_date'] ?? date('Y-m-d'),
        $quantity,
        $refundAmount,
        $data['reason'] ?? '',
        $data['status'] ?? 'Hoàn thành',
    ]);

    ok(['id' => (int) db()->lastInsertId()], 'Tạo phiếu trả hàng thành công');
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    require_fields($data, ['id']);
    $stmt = db()->prepare('UPDATE returns SET reason = ?, status = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([$data['reason'] ?? '', $data['status'] ?? 'Hoàn thành', $data['id']]);
    ok(null, 'Cập nhật phiếu trả hàng thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã phiếu trả hàng.', 422);
    $stmt = db()->prepare('DELETE FROM returns WHERE id = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa phiếu trả hàng thành công');
}
