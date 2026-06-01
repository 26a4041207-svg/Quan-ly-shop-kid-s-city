<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['POST']);
$user = current_user();
$data = input();
require_fields($data, ['newPassword', 'confirmNewPassword']);

if ((string) $data['newPassword'] !== (string) $data['confirmNewPassword']) {
    fail('Mật khẩu mới và xác nhận lại mật khẩu mới phải giống nhau.', 422, ['newPassword', 'confirmNewPassword']);
}

if (strlen((string) $data['newPassword']) < 6) {
    fail('Mật khẩu mới phải có ít nhất 6 ký tự.', 422, ['newPassword']);
}

if (password_matches((string) $data['newPassword'], (string) $user['password_hash'])) {
    fail('Mật khẩu mới không được trùng với mật khẩu hiện tại.', 422, ['newPassword']);
}

$stmt = db()->prepare('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?');
$stmt->execute([password_hash((string) $data['newPassword'], PASSWORD_DEFAULT), $user['id']]);

ok(null, 'Đổi mật khẩu thành công');
