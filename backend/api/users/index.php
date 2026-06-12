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

function saveBase64Image($base64String) {
    if (!$base64String || strpos($base64String, 'data:image/') !== 0) return '';
    $parts = explode(';', $base64String);
    if (count($parts) < 2) return '';
    $base64Data = explode(',', $parts[1])[1] ?? '';
    $decodedData = base64_decode($base64Data);
    if ($decodedData === false) return '';
    if (strlen($decodedData) > 5 * 1024 * 1024) fail('Dung lượng ảnh vượt quá 5MB.', 400);
    
    $filename = 'cccd_' . time() . '_' . uniqid() . '.jpg';
    $dir = __DIR__ . '/../../uploads/cccd';
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    
    file_put_contents($dir . '/' . $filename, $decodedData);
    return 'backend/uploads/cccd/' . $filename;
}

if ($method === 'POST') {
    require_admin();
    $data = input();
    require_fields($data, ['name', 'username', 'password', 'email', 'phone', 'cccd_image']);

    if (strlen((string) $data['phone']) !== 10) {
        fail('Số điện thoại phải bao gồm đúng 10 chữ số.', 400);
    }

    $imagePath = saveBase64Image($data['cccd_image']);
    if (!$imagePath) {
        fail('Ảnh CCCD không hợp lệ hoặc bị thiếu.', 400);
    }

    $role = ($data['role'] ?? 'staff') === 'admin' ? 'admin' : 'staff';
    $status = $data['status'] ?? 'Chưa kích hoạt';

    try {
        $stmt = db()->prepare(
            'INSERT INTO users (username, password_hash, name, email, phone, cccd_image, role, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $data['username'],
            password_hash((string) $data['password'], PASSWORD_DEFAULT),
            $data['name'],
            $data['email'],
            $data['phone'],
            $imagePath,
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
    
    if (empty($data['id'])) {
        fail('Thiếu mã người dùng', 422);
    }
    
    $select = db()->prepare('SELECT * FROM users WHERE id = ?');
    $select->execute([$data['id']]);
    $existing = $select->fetch();
    
    if (!$existing) {
        fail('Không tìm thấy người dùng', 404);
    }

    $username = $data['username'] ?? $existing['username'];
    $name = $data['name'] ?? $existing['name'];
    $email = array_key_exists('email', $data) ? $data['email'] : $existing['email'];
    $phone = array_key_exists('phone', $data) ? $data['phone'] : $existing['phone'];
    
    if (array_key_exists('phone', $data) && strlen((string) $data['phone']) !== 10) {
        fail('Số điện thoại phải bao gồm đúng 10 chữ số.', 400);
    }

    $imagePath = $existing['cccd_image'];
    if (!empty($data['cccd_image']) && strpos($data['cccd_image'], 'data:image/') === 0) {
        $newImagePath = saveBase64Image($data['cccd_image']);
        if ($newImagePath) {
            $imagePath = $newImagePath;
        }
    }

    $role = array_key_exists('role', $data) ? ($data['role'] === 'admin' ? 'admin' : 'staff') : $existing['role'];
    $status = $data['status'] ?? $existing['status'];

    $stmt = db()->prepare(
        'UPDATE users
         SET username = ?, name = ?, email = ?, phone = ?, cccd_image = ?, role = ?, status = ?, updated_at = NOW()
         WHERE id = ?'
    );
    $stmt->execute([
        $username,
        $name,
        $email,
        $phone,
        $imagePath,
        $role,
        $status,
        $data['id'],
    ]);

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
