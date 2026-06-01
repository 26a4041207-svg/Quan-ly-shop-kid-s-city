<?php
declare(strict_types=1);

require_once __DIR__ . '/../../core/bootstrap.php';

route_method(['POST']);
$token = bearer_token();

if ($token !== '') {
    $stmt = db()->prepare('DELETE FROM api_tokens WHERE token = ?');
    $stmt->execute([$token]);
}

ok(null, 'Đăng xuất thành công');
