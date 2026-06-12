<?php
require '../../core/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = input();
    if (empty($data['email'])) {
        fail('Vui lòng nhập email.', 400);
    }

    $email = trim($data['email']);
    $stmt = db()->prepare('SELECT id, name FROM users WHERE email = ? AND status != "Khóa"');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        fail('Email không tồn tại, vui lòng nhập lại.', 404);
    }

    // Generate 6 digit OTP
    $otp = sprintf("%06d", mt_rand(1, 999999));
    
    // Save to database
    $stmt = db()->prepare('UPDATE users SET reset_otp = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id = ?');
    $stmt->execute([$otp, $user['id']]);

    // Attempt to send email
    $subject = "Mã OTP Đặt Lại Mật Khẩu - Kid's City";
    $message = "Xin chào " . $user['name'] . ",\n\n";
    $message .= "Mã OTP để đặt lại mật khẩu của bạn là: " . $otp . "\n\n";
    $message .= "Mã này sẽ hết hạn sau 15 phút.\nNếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.\n";
    $headers = "From: noreply@kidscity.vn";

    @mail($email, $subject, $message, $headers);

    // Also log the OTP for local testing
    $logDir = __DIR__ . '/../../uploads';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0777, true);
    }
    file_put_contents($logDir . '/otp_log.txt', "[" . date('Y-m-d H:i:s') . "] OTP for $email is: $otp\n", FILE_APPEND);

    ok(['message' => 'Mã OTP đã được gửi.'], 'Gửi mã OTP thành công');
}

fail('Method not allowed', 405);
