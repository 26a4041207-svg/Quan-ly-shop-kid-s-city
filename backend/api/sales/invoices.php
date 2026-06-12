<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

function next_code(string $table, string $prefix): string
{
    $stmt = db()->query("SELECT code FROM {$table} ORDER BY id DESC LIMIT 1");
    $last = (string) ($stmt->fetch()['code'] ?? '');
    $number = (int) preg_replace('/\D+/', '', $last);
    return $prefix . str_pad((string) ($number + 1), 3, '0', STR_PAD_LEFT);
}

if ($method === 'GET') {
    current_user();
    $stmt = db()->query(
        'SELECT i.*, c.name AS customer_name, u.name AS staff_name
         FROM invoices i
         LEFT JOIN customers c ON c.id = i.customer_id
         LEFT JOIN users u ON u.id = i.staff_id
         ORDER BY i.id DESC'
    );
    $invoices = $stmt->fetchAll();

    foreach ($invoices as &$invoice) {
        $items = db()->prepare(
            'SELECT d.*, p.code AS product_code, p.name AS product_name
             FROM invoice_details d
             LEFT JOIN products p ON p.id = d.product_id
             WHERE d.invoice_id = ?'
        );
        $items->execute([$invoice['id']]);
        $invoice['items'] = $items->fetchAll();
    }

    ok($invoices);
}

if ($method === 'POST') {
    $user = current_user();
    $data = input();
    require_fields($data, ['customer_id', 'items']);

    $items = is_array($data['items']) ? $data['items'] : [];
    if (!$items) fail('Vui lòng thêm ít nhất một sản phẩm.', 422);

    db()->beginTransaction();
    try {
        $code = $data['code'] ?? next_code('invoices', 'HD');
        $discount = (float) ($data['discount'] ?? 0);
        $total = 0;
        $preparedItems = [];

        foreach ($items as $item) {
            $productId = (int) ($item['product_id'] ?? 0);
            $quantity = max(1, (int) ($item['quantity'] ?? 1));
            $product = db()->prepare('SELECT id, price, stock FROM products WHERE id = ?');
            $product->execute([$productId]);
            $row = $product->fetch();
            if (!$row) fail('Sản phẩm không tồn tại.', 422);

            $price = (float) ($item['price'] ?? $row['price']);
            $lineDiscount = (float) ($item['discount'] ?? 0);
            $lineTotal = max(0, $price * $quantity - $lineDiscount);
            $total += $lineTotal;
            $preparedItems[] = [$productId, $quantity, $price, $lineDiscount, $lineTotal];
        }

        $grandTotal = max(0, $total - $discount);
        $stmt = db()->prepare(
            'INSERT INTO invoices (code, customer_id, staff_id, invoice_date, note, discount, total)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $code,
            $data['customer_id'],
            $user['id'],
            $data['invoice_date'] ?? date('Y-m-d'),
            $data['note'] ?? '',
            $discount,
            $grandTotal,
        ]);

        $invoiceId = (int) db()->lastInsertId();
        $detail = db()->prepare(
            'INSERT INTO invoice_details (invoice_id, product_id, quantity, price, discount, line_total)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stock = db()->prepare('UPDATE products SET stock = GREATEST(stock - ?, 0), updated_at = NOW() WHERE id = ?');
        foreach ($preparedItems as $item) {
            $detail->execute([$invoiceId, $item[0], $item[1], $item[2], $item[3], $item[4]]);
            $stock->execute([$item[1], $item[0]]);
        }

        db()->commit();
        ok(['id' => $invoiceId, 'code' => $code], 'Tạo hóa đơn thành công');
    } catch (Throwable $exception) {
        db()->rollBack();
        fail('Không thể tạo hóa đơn.', 500, $exception->getMessage());
    }
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    require_fields($data, ['id']);
    $stmt = db()->prepare('UPDATE invoices SET note = ?, status = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([
        $data['note'] ?? '',
        $data['status'] ?? 'Hòan thành',
        $data['id'],
    ]);
    ok(null, 'Cập nhật hóa đơn thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã hóa đơn.', 422);
    $stmt = db()->prepare('DELETE FROM invoices WHERE id = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa hóa đơn thành công');
}
