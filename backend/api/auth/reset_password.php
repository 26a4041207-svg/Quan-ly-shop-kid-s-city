<?php
require '../../core/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = input();
    if (empty($data['email']) || empty($data['otp']) || empty($data['password'])) {
        fail('Vui lòng cung cấp đầy đủ thông tin.', 400);
    }

    $email = trim($data['email']);
    $otp = trim($data['otp']);
    $password = $data['password'];

    $stmt = db()->prepare('SELECT id, reset_otp, otp_expires_at FROM users WHERE email = ? AND status != "Khóa"');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        fail('Email không tồn tại hoặc tài khoản bị khóa.', 404);
    }

    if ($user['reset_otp'] !== $otp) {
        fail('Mã OTP không đúng.', 400);
    }

    if (strtotime($user['otp_expires_at']) < time()) {
        fail('Mã OTP đã hết hạn.', 400);
    }

    // Set new password and clear OTP
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = db()->prepare('UPDATE users SET password_hash = ?, reset_otp = NULL, otp_expires_at = NULL WHERE id = ?');
    $stmt->execute([$hash, $user['id']]);

    ok(['message' => 'Cập nhật mật khẩu thành công.'], 'Đổi mật khẩu thành công');
}

fail('Method not allowed', 405);
