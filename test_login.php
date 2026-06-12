<?php
require 'backend/core/bootstrap.php';
$stmt = db()->prepare('SELECT * FROM NguoiDung WHERE tenDangNhap = ?');
$stmt->execute(['0837180653']);
$user = $stmt->fetch();
$password = 'm8spvrji';
$matches = password_verify($password, $user['matKhau']);
echo "Matches: " . ($matches ? 'true' : 'false') . "\n";
echo "Hash: " . $user['matKhau'] . "\n";
