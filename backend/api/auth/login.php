<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['POST']);
$data = input();
require_fields($data, ['username', 'password']);

$stmt = db()->prepare('SELECT * FROM users WHERE username = ? OR phone = ? LIMIT 1');
$stmt->execute([$data['username'], $data['username']]);
$user = $stmt->fetch();

if (!$user || !password_matches((string) $data['password'], (string) $user['password_hash'])) {
    fail('Tên đăng nhập hoặc mật khẩu không đúng.', 401);
}

if ($user['status'] === 'Khóa') {
    fail('Tài khoản này đang bị khóa. Vui lòng liên hệ chủ shop.', 403);
}

if ($user['status'] === 'Chưa kích hoạt') {
    $update = db()->prepare('UPDATE users SET status = "Đã kích hoạt" WHERE id = ?');
    $update->execute([$user['id']]);
    $user['status'] = 'Đã kích hoạt';
}

$token = bin2hex(random_bytes(32));
$expiresAt = (new DateTimeImmutable('+7 days'))->format('Y-m-d H:i:s');
$insert = db()->prepare('INSERT INTO api_tokens (user_id, token, expires_at) VALUES (?, ?, ?)');
$insert->execute([$user['id'], $token, $expiresAt]);

ok([
    'token' => $token,
    'expiresAt' => $expiresAt,
    'user' => public_user($user),
]);
