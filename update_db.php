<?php
require 'backend/core/bootstrap.php';

// 1. Create directory if not exists
$uploadDir = __DIR__ . '/backend/uploads/cccd';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// 2. Update DB Schema
try {
    db()->exec("ALTER TABLE users DROP COLUMN IF EXISTS address");
} catch(Exception $e) {
    echo "Drop address ignored (may not exist). ";
}

try {
    db()->exec("ALTER TABLE users CHANGE COLUMN cccd cccd_image VARCHAR(255) NULL");
    echo "Schema updated successfully.\n";
} catch(Exception $e) {
    try {
        db()->exec("ALTER TABLE users ADD COLUMN cccd_image VARCHAR(255) NULL AFTER phone");
        echo "Added cccd_image successfully.\n";
    } catch(Exception $e2) {
        echo "Error: " . $e2->getMessage() . "\n";
    }
}

try {
    db()->exec("ALTER TABLE users ADD COLUMN reset_otp VARCHAR(6) NULL, ADD COLUMN otp_expires_at DATETIME NULL");
    echo "Added reset_otp and otp_expires_at successfully.\n";
} catch(Exception $e) {
    echo "OTP columns already exist or error: " . $e->getMessage() . "\n";
}
