<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

$method = route_method(['GET', 'POST', 'PUT', 'DELETE']);

function next_import_code(): string
{
    $stmt = db()->query('SELECT code FROM import_receipts ORDER BY id DESC LIMIT 1');
    $row = $stmt->fetch();
    $last = $row ? (string) ($row['code'] ?? '') : '';
    $number = (int) preg_replace('/\D+/', '', $last);
    return 'NH' . str_pad((string) ($number + 1), 3, '0', STR_PAD_LEFT);
}

function next_product_code(): string
{
    $stmt = db()->query("SELECT code FROM products WHERE code LIKE 'SP%' ORDER BY id DESC LIMIT 1");
    $row = $stmt->fetch();
    $last = $row ? (string) ($row['code'] ?? '') : '';
    $number = (int) preg_replace('/\D+/', '', $last);
    if ($number === 0) {
        $stmt2 = db()->query("SELECT COUNT(*) as cnt FROM products");
        $row2 = $stmt2->fetch();
        $number = $row2 ? (int) ($row2['cnt'] ?? 0) : 0;
    }
    return 'SP' . str_pad((string) ($number + 1), 3, '0', STR_PAD_LEFT);
}

function get_or_create_category(string $name): ?int
{
    $name = trim($name);
    if ($name === '') return null;
    
    $stmt = db()->prepare('SELECT id FROM categories WHERE name = ?');
    $stmt->execute([$name]);
    $cat = $stmt->fetch();
    if ($cat) {
        return (int) $cat['id'];
    }
    
    // Auto-generate DM code
    $stmt = db()->query("SELECT code FROM categories WHERE code LIKE 'DM%' ORDER BY id DESC LIMIT 1");
    $row = $stmt->fetch();
    $last = $row ? (string) ($row['code'] ?? '') : '';
    $number = (int) preg_replace('/\D+/', '', $last);
    if ($number === 0) {
        $stmt2 = db()->query("SELECT COUNT(*) as cnt FROM categories");
        $row2 = $stmt2->fetch();
        $number = $row2 ? (int) ($row2['cnt'] ?? 0) : 0;
    }
    $code = 'DM' . str_pad((string) ($number + 1), 3, '0', STR_PAD_LEFT);
    
    $stmt = db()->prepare('INSERT INTO categories (code, name, status) VALUES (?, ?, "Đang bán")');
    $stmt->execute([$code, $name]);
    return (int) db()->lastInsertId();
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
                    p.image AS product_image,
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

        $importId = 0;
        $importCode = next_import_code();
        $stmt = db()->prepare(
            'INSERT INTO import_receipts (code, supplier, staff_id, import_date, note, total)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $importCode,
            $data['supplier'],
            $user['id'],
            date('Y-m-d'),
            $data['note'] ?? '',
            $total,
        ]);
        $importId = (int) db()->lastInsertId();

        $detail = db()->prepare(
            'INSERT INTO import_details (import_id, product_id, quantity, price, line_total)
             VALUES (?, ?, ?, ?, ?)'
        );

        foreach ($items as $item) {
            $name = trim($item['name'] ?? '');
            $size = trim($item['size'] ?? '');
            $color = trim($item['color'] ?? '');
            $qty = max(1, (int) ($item['quantity'] ?? 1));
            $price = (float) ($item['price'] ?? 0); // This is selling price, will be mapped to product price and import price
            
            // Check if product variation exists
            $prodStmt = db()->prepare('SELECT id FROM products WHERE name = ? AND size = ? AND color = ?');
            $prodStmt->execute([$name, $size, $color]);
            $prod = $prodStmt->fetch();
            
            $productId = 0;
            if ($prod) {
                $productId = (int) $prod['id'];
                // Update existing product stock and price
                if (!empty($item['image'])) {
                    $upStmt = db()->prepare('UPDATE products SET stock = stock + ?, price = ?, import_price = ?, image = ?, status = "Đang bán", updated_at = NOW() WHERE id = ?');
                    $upStmt->execute([$qty, $price, $price, $item['image'], $productId]);
                } else {
                    $upStmt = db()->prepare('UPDATE products SET stock = stock + ?, price = ?, import_price = ?, status = "Đang bán", updated_at = NOW() WHERE id = ?');
                    $upStmt->execute([$qty, $price, $price, $productId]);
                }
            } else {
                // Create new product variation
                $code = next_product_code();
                $categoryId = get_or_create_category($item['category_name'] ?? '');
                
                $insStmt = db()->prepare(
                    'INSERT INTO products (code, category_id, name, size, color, price, import_price, stock, image, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "Đang bán")'
                );
                $insStmt->execute([
                    $code,
                    $categoryId,
                    $name,
                    $size,
                    $color,
                    $price, // price
                    $price, // import_price
                    $qty,
                    $item['image'] ?? '',
                ]);
                $productId = (int) db()->lastInsertId();
            }

            $lineTotal = $price * $qty;
            $detail->execute([$importId, $productId, $qty, $price, $lineTotal]);
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
    $importId = (int) $data['id'];
    $items = is_array($data['items'] ?? null) ? $data['items'] : [];

    db()->beginTransaction();
    try {
        // 1. Get old items and revert stock
        $oldStmt = db()->prepare('SELECT product_id, quantity FROM import_details WHERE import_id = ?');
        $oldStmt->execute([$importId]);
        $oldItems = $oldStmt->fetchAll();

        $revertStmt = db()->prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
        foreach ($oldItems as $old) {
            if ($old['product_id']) {
                $revertStmt->execute([$old['quantity'], $old['product_id']]);
            }
        }

        // 2. Delete old details
        $deleteStmt = db()->prepare('DELETE FROM import_details WHERE import_id = ?');
        $deleteStmt->execute([$importId]);

        // 3. Process and insert new details
        $total = 0;
        $detail = db()->prepare(
            'INSERT INTO import_details (import_id, product_id, quantity, price, line_total)
             VALUES (?, ?, ?, ?, ?)'
        );

        foreach ($items as $item) {
            $name = trim($item['name'] ?? '');
            $size = trim($item['size'] ?? '');
            $color = trim($item['color'] ?? '');
            $qty = max(1, (int) ($item['quantity'] ?? 1));
            $price = (float) ($item['price'] ?? 0);
            $total += $price * $qty;

            // Check if product variation exists
            $prodStmt = db()->prepare('SELECT id FROM products WHERE name = ? AND size = ? AND color = ?');
            $prodStmt->execute([$name, $size, $color]);
            $prod = $prodStmt->fetch();

            $productId = 0;
            if ($prod) {
                $productId = (int) $prod['id'];
                // Update stock and price
                if (!empty($item['image'])) {
                    $upStmt = db()->prepare('UPDATE products SET stock = stock + ?, price = ?, import_price = ?, image = ?, status = "Đang bán", updated_at = NOW() WHERE id = ?');
                    $upStmt->execute([$qty, $price, $price, $item['image'], $productId]);
                } else {
                    $upStmt = db()->prepare('UPDATE products SET stock = stock + ?, price = ?, import_price = ?, status = "Đang bán", updated_at = NOW() WHERE id = ?');
                    $upStmt->execute([$qty, $price, $price, $productId]);
                }
            } else {
                $code = next_product_code();
                $categoryId = get_or_create_category($item['category_name'] ?? '');
                $insStmt = db()->prepare(
                    'INSERT INTO products (code, category_id, name, size, color, price, import_price, stock, image, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "Đang bán")'
                );
                $insStmt->execute([
                    $code,
                    $categoryId,
                    $name,
                    $size,
                    $color,
                    $price,
                    $price,
                    $qty,
                    $item['image'] ?? '',
                ]);
                $productId = (int) db()->lastInsertId();
            }

            $lineTotal = $price * $qty;
            $detail->execute([$importId, $productId, $qty, $price, $lineTotal]);
        }

        // 4. Update import receipt supplier, note, total
        $stmt = db()->prepare('UPDATE import_receipts SET supplier = ?, note = ?, total = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([
            $data['supplier'],
            $data['note'] ?? '',
            $total,
            $importId,
        ]);

        db()->commit();
        ok(null, 'Cập nhật phiếu nhập hàng thành công');
    } catch (Throwable $exception) {
        db()->rollBack();
        fail('Không thể cập nhật phiếu nhập hàng.', 500, $exception->getMessage());
    }
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) fail('Thiếu mã phiếu nhập hàng.', 422);
    $stmt = db()->prepare('DELETE FROM import_receipts WHERE id = ?');
    $stmt->execute([$id]);
    ok(null, 'Xóa phiếu nhập hàng thành công');
}

