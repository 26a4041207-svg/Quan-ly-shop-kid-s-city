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
            'SELECT 
                maNguoiDung AS id,
                tenDangNhap AS username,
                matKhau AS password_hash,
                tenNguoiDung AS name,
                email AS email,
                soDienThoai AS phone,
                anhCCCD AS cccd,
                "" AS address,
                IF(vaiTro = "chushop", "admin", "staff") AS role,
                IF(trangThai = 1, "Đã kích hoạt", IF(lanDangNhapDau = 1, "Chưa kích hoạt", "Khóa")) AS status,
                matKhauBanDau AS initial_password,
                ngayTao AS created_at,
                ngayCapNhat AS updated_at
             FROM NguoiDung
             WHERE tenNguoiDung LIKE ? OR tenDangNhap LIKE ? OR email LIKE ? OR soDienThoai LIKE ?
             ORDER BY trangThai DESC, maNguoiDung DESC'
        );
        $stmt->execute([$like, $like, $like, $like]);
    } else {
        $stmt = db()->query('SELECT 
                maNguoiDung AS id,
                tenDangNhap AS username,
                matKhau AS password_hash,
                tenNguoiDung AS name,
                email AS email,
                soDienThoai AS phone,
                anhCCCD AS cccd,
                "" AS address,
                IF(vaiTro = "chushop", "admin", "staff") AS role,
                IF(trangThai = 1, "Đã kích hoạt", IF(lanDangNhapDau = 1, "Chưa kích hoạt", "Khóa")) AS status,
                matKhauBanDau AS initial_password,
                ngayTao AS created_at,
                ngayCapNhat AS updated_at
             FROM NguoiDung ORDER BY trangThai DESC, maNguoiDung DESC');
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
    
    if (!preg_match('/^[a-zA-Z0-9._%+-]+@gmail\.com$/', (string) $data['email'])) {
        fail('Email phải có định dạng @gmail.com.', 400);
    }

    $imagePath = saveBase64Image($data['cccd_image']);
    if (!$imagePath) {
        fail('Ảnh CCCD không hợp lệ hoặc bị thiếu.', 400);
    }

    $checkStmt = db()->prepare('SELECT 1 FROM NguoiDung WHERE soDienThoai = ?');
    $checkStmt->execute([$data['phone']]);
    if ($checkStmt->fetch()) {
        fail('Số điện thoại này đã tồn tại trong hệ thống.', 409);
    }

    $checkEmailStmt = db()->prepare('SELECT 1 FROM NguoiDung WHERE email = ?');
    $checkEmailStmt->execute([$data['email']]);
    if ($checkEmailStmt->fetch()) {
        fail('Email này đã tồn tại trong hệ thống.', 409);
    }

    $role = ($data['role'] ?? 'staff') === 'admin' ? 'chushop' : 'nhanvien';
    $status = ($data['status'] ?? 'Khóa') === 'Đã kích hoạt' ? 1 : 0;
    $username = $data['phone'];

    try {
        $stmt = db()->prepare(
            'INSERT INTO NguoiDung (tenNguoiDung, tenDangNhap, matKhau, email, soDienThoai, anhCCCD, vaiTro, trangThai, lanDangNhapDau, matKhauBanDau)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)'
        );
        $stmt->execute([
            $data['name'],
            $username,
            password_hash((string) $data['password'], PASSWORD_DEFAULT),
            $data['email'],
            $data['phone'],
            $imagePath,
            $role,
            $status,
            (string) $data['password']
        ]);
    } catch (PDOException $exception) {
        fail('Tên đăng nhập hoặc số điện thoại đã tồn tại.', 409);
    }

    $user = db()->query('SELECT 
                maNguoiDung AS id,
                tenDangNhap AS username,
                matKhau AS password_hash,
                tenNguoiDung AS name,
                email AS email,
                soDienThoai AS phone,
                anhCCCD AS cccd,
                "" AS address,
                IF(vaiTro = "chushop", "admin", "staff") AS role,
                IF(trangThai = 1, "Đã kích hoạt", "Khóa") AS status,
                ngayTao AS created_at,
                ngayCapNhat AS updated_at
             FROM NguoiDung WHERE maNguoiDung = LAST_INSERT_ID()')->fetch();
    ok(public_user($user), 'Thêm người dùng thành công');
}

if ($method === 'PUT') {
    require_admin();
    $data = input();
    
    if (empty($data['id'])) {
        fail('Thiếu mã người dùng', 422);
    }
    
    $select = db()->prepare('SELECT 
                maNguoiDung AS id,
                tenDangNhap AS username,
                matKhau AS password_hash,
                tenNguoiDung AS name,
                email AS email,
                soDienThoai AS phone,
                anhCCCD AS cccd_image,
                anhCCCD AS cccd,
                "" AS address,
                IF(vaiTro = "chushop", "admin", "staff") AS role,
                IF(trangThai = 1, "Đã kích hoạt", "Khóa") AS status,
                ngayTao AS created_at,
                ngayCapNhat AS updated_at
             FROM NguoiDung WHERE maNguoiDung = ?');
    $select->execute([$data['id']]);
    $existing = $select->fetch();
    
    if (!$existing) {
        fail('Không tìm thấy người dùng', 404);
    }

    $name = $data['name'] ?? $existing['name'];
    $email = array_key_exists('email', $data) ? $data['email'] : $existing['email'];
    $phone = array_key_exists('phone', $data) ? $data['phone'] : $existing['phone'];
    
    if (array_key_exists('phone', $data) && strlen((string) $data['phone']) !== 10) {
        fail('Số điện thoại phải bao gồm đúng 10 chữ số.', 400);
    }
    
    if (array_key_exists('email', $data) && !preg_match('/^[a-zA-Z0-9._%+-]+@gmail\.com$/', (string) $data['email'])) {
        fail('Email phải có định dạng @gmail.com.', 400);
    }

    $checkStmt = db()->prepare('SELECT 1 FROM NguoiDung WHERE soDienThoai = ? AND maNguoiDung != ?');
    $checkStmt->execute([$phone, $data['id']]);
    if ($checkStmt->fetch()) {
        fail('Số điện thoại này đã tồn tại trong hệ thống.', 409);
    }

    $checkEmailStmt = db()->prepare('SELECT 1 FROM NguoiDung WHERE email = ? AND maNguoiDung != ?');
    $checkEmailStmt->execute([$email, $data['id']]);
    if ($checkEmailStmt->fetch()) {
        fail('Email này đã tồn tại trong hệ thống.', 409);
    }

    $imagePath = $existing['cccd_image'];
    if (!empty($data['cccd_image']) && strpos($data['cccd_image'], 'data:image/') === 0) {
        $newImagePath = saveBase64Image($data['cccd_image']);
        if ($newImagePath) {
            $imagePath = $newImagePath;
        }
    }

    $role = array_key_exists('role', $data) ? ($data['role'] === 'admin' ? 'chushop' : 'nhanvien') : ($existing['role'] === 'admin' ? 'chushop' : 'nhanvien');
    $status = array_key_exists('status', $data) ? ($data['status'] === 'Đã kích hoạt' ? 1 : 0) : ($existing['status'] === 'Đã kích hoạt' ? 1 : 0);

    $sql = 'UPDATE NguoiDung SET tenNguoiDung = ?, email = ?, soDienThoai = ?, anhCCCD = ?, vaiTro = ?, trangThai = ?, ngayCapNhat = NOW()';
    $params = [$name, $email, $phone, $imagePath, $role, $status];

    if (array_key_exists('status', $data)) {
        if ($data['status'] === 'Khóa') {
            $sql .= ', lanDangNhapDau = 0';
        } else if ($data['status'] === 'Đã kích hoạt') {
            $sql .= ', lanDangNhapDau = 0';
        }
    }

    $sql .= ' WHERE maNguoiDung = ?';
    $params[] = $data['id'];

    $stmt = db()->prepare($sql);
    $stmt->execute($params);

    $select->execute([$data['id']]);
    ok(public_user($select->fetch()), 'Cập nhật người dùng thành công');
}

if ($method === 'DELETE') {
    require_admin();
    $id = (int) ($_GET['id'] ?? 0);
    if ($id <= 0) {
        fail('Thiếu mã người dùng.', 422);
    }

    $stmt = db()->prepare('DELETE FROM NguoiDung WHERE maNguoiDung = ? AND vaiTro <> "chushop"');
    $stmt->execute([$id]);
    ok(null, 'Xóa người dùng thành công');
}

