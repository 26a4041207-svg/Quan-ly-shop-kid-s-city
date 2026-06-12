<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/response.php';

function bearer_token(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        return trim($matches[1]);
    }

    return '';
}

function public_user(array $user): array
{
    $pub = [
        'id' => (int) $user['id'],
        'username' => $user['username'],
        'name' => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
        'cccd' => $user['cccd'] ?? '',
        'address' => $user['address'] ?? '',
        'role' => $user['role'],
        'roleLabel' => $user['role'] === 'admin' ? 'Chủ shop' : 'Nhân viên',
        'status' => $user['status'],
        'created' => $user['created_at'] ?? null,
    ];
    if (array_key_exists('initial_password', $user)) {
        $pub['initial_password'] = $user['initial_password'];
    }
    return $pub;
}

function current_user(): array
{
    $token = bearer_token();
    if ($token === '') {
        fail('Bạn chưa đăng nhập.', 401);
    }

    $stmt = db()->prepare(
        'SELECT 
            u.maNguoiDung AS id,
            u.tenDangNhap AS username,
            u.matKhau AS password_hash,
            u.tenNguoiDung AS name,
            u.email AS email,
            u.soDienThoai AS phone,
            u.anhCCCD AS cccd,
            "" AS address,
            IF(u.vaiTro = "chushop", "admin", "staff") AS role,
            IF(u.trangThai = 1, "Đã kích hoạt", "Khóa") AS status,
            u.ngayTao AS created_at,
            u.ngayCapNhat AS updated_at
         FROM api_tokens t
         INNER JOIN NguoiDung u ON u.maNguoiDung = t.user_id
         WHERE t.token = ? AND t.expires_at > NOW() AND (u.trangThai = 1 OR (u.trangThai = 0 AND u.lanDangNhapDau = 1))
         LIMIT 1'
    );
    $stmt->execute([$token]);
    $user = $stmt->fetch();

    if (!$user) {
        fail('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.', 401);
    }

    return $user;
}

function require_admin(): array
{
    $user = current_user();
    if (($user['role'] ?? '') !== 'admin') {
        fail('Bạn không có quyền thực hiện thao tác này.', 403);
    }
    return $user;
}

function password_matches(string $inputPassword, string $storedPassword): bool
{
    if (strncmp($storedPassword, '$2y$', 4) === 0 || strncmp($storedPassword, '$argon2', 7) === 0) {
        return password_verify($inputPassword, $storedPassword);
    }

    return hash_equals($storedPassword, $inputPassword);
}
