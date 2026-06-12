<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['POST']);
$data = input();
require_fields($data, ['username', 'password']);

$stmt = db()->prepare('SELECT maNguoiDung AS id, tenDangNhap AS username, matKhau AS password_hash, tenNguoiDung AS name, email AS email, soDienThoai AS phone, anhCCCD AS cccd, "" AS address, IF(vaiTro = "chushop", "admin", "staff") AS role, IF(trangThai = 1, "Đã kích hoạt", IF(lanDangNhapDau = 1, "Chưa kích hoạt", "Khóa")) AS status, trangThai, lanDangNhapDau, ngayTao AS created_at, ngayCapNhat AS updated_at FROM NguoiDung WHERE tenDangNhap = ? OR soDienThoai = ? LIMIT 1');
$stmt->execute([$data['username'], $data['username']]);
$user = $stmt->fetch();

if (!$user || !password_matches((string) $data['password'], (string) $user['password_hash'])) {
    fail('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
}

if ($user['status'] === 'Khóa') {
    fail('Tài khoản này đang bị khóa. Vui lòng liên hệ chủ shop.', 403);
}

$token = bin2hex(random_bytes(32));
$expiresAt = (new DateTimeImmutable('+7 days'))->format('Y-m-d H:i:s');
$insert = db()->prepare('INSERT INTO api_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
$insert->execute([$user['id'], $token, $expiresAt]);

$publicUser = public_user($user);
$publicUser['is_first_login'] = $user['status'] === 'Chưa kích hoạt';

ok([
    'token' => $token,
    'expiresAt' => $expiresAt,
    'user' => $publicUser,
]);
