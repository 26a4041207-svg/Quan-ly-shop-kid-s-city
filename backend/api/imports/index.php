<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

function next_import_code(): string
{
    $stmt = db()->query('SELECT code FROM import_receipts ORDER BY id DESC LIMIT 1');
    $last = (string) ($stmt->fetch()['code'] ?? '');
    $number = (int) preg_replace('/\D+/', '', $last);
    return 'NH' . str_pad((string) ($number + 1), 3, '0', STR_PAD_LEFT);
}

if ($method === 'GET') {
    current_user();
    $stmt = db()->query(
        'SELECT r.*, u.name AS staff_name
         FROM import_receipts r
         LEFT JOIN users u ON u.id = r.staff_id
         ORDER BY r.id DESC'
    );
    $receipts = $stmt->fetchAll();

    foreach ($receipts as &$receipt) {
        $items = db()->prepare(
            'SELECT d.*,
                    p.code AS product_code,
                    p.name AS product_name,
                    p.size,
                    p.color,
                    p.image,
                    c.name AS category_name
             FROM import_details d
             LEFT JOIN products p ON p.id = d.product_id
             LEFT JOIN categories c ON c.id = p.category_id
             WHERE d.import_id = ?'
        );
        $items->execute([$receipt['id']]);
        $receipt['items'] = $items->fetchAll();
    }

    ok($receipts);
}

if ($method === 'POST') {
    $user = current_user();
    $data = input();
    require_fields($data, ['supplier', 'items']);
    $items = is_array($data['items']) ? $data['items'] : [];
    if (!$items) fail('Vui lòng thêm ít nhất một sản phẩm.', 422);

    db()->beginTransaction();
    try {
        $total = 0;
        foreach ($items as $item) {
            $total += (float) ($item['price'] ?? 0) * max(1, (int) ($item['quantity'] ?? 1));
        }

        $stmt = db()->prepare(
            'INSERT INTO import_receipts (code, supplier, staff_id, import_date, note, total)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['code'] ?? next_import_code(),
            $data['supplier'],
            $user['id'],
            $data['import_date'] ?? date('Y-m-d'),
            $data['note'] ?? '',
            $total,
        ]);
        $importId = (int) db()->lastInsertId();

        $detail = db()->prepare(
            'INSERT INTO import_details (import_id, product_id, quantity, price, line_total)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stock = db()->prepare('UPDATE products SET stock = stock + ?, import_price = ?, updated_at = NOW() WHERE id = ?');
        foreach ($items as $item) {
            $productId = (int) ($item['product_id'] ?? 0);
            $quantity = max(1, (int) ($item['quantity'] ?? 1));
            $price = (float) ($item['price'] ?? 0);
            $lineTotal = $price * $quantity;
            $detail->execute([$importId, $productId, $quantity, $price, $lineTotal]);
            $stock->execute([$quantity, $price, $productId]);
        }

        db()->commit();
        ok(['id' => $importId], 'Tạo phiếu nhập hàng thành công');
    } catch (Throwable $exception) {
        db()->rollBack();
        fail('Không thể tạo phiếu nhập hàng.', 500, $exception->getMessage());
    }
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    require_fields($data, ['id', 'supplier']);
    $stmt = db()->prepare('UPDATE import_receipts SET supplier = ?, import_date = ?, note = ?, updated_at = NOW() WHERE id = ?');
    $stmt->execute([
        $data['supplier'],
        $data['import_date'] ?? date('Y-m-d'),
        $data['note'] ?? '',
        $data['id'],
    ]);
    ok(null, 'Cập nhật phiếu nhập hàng thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã phiếu nhập hàng.', 422);
    $stmt = db()->prepare('DELETE FROM import_receipts WHERE id = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa phiếu nhập hàng thành công');
}
