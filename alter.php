<?php
require __DIR__ . '/backend/core/bootstrap.php';
try {
    db()->query('ALTER TABLE ChiTietDoiHang ADD COLUMN soLuongMoi INT NOT NULL DEFAULT 1 AFTER soLuong');
    echo "Added soLuongMoi column successfully.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

try {
    db()->query('ALTER TABLE NguoiDung ADD COLUMN lanDangNhapDau TINYINT(1) DEFAULT 1 AFTER trangThai');
    echo "Added lanDangNhapDau column successfully.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column lanDangNhapDau already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

try {
    db()->query('UPDATE NguoiDung SET tenDangNhap = soDienThoai');
    echo "Updated tenDangNhap to soDienThoai successfully.\n";
} catch (Exception $e) {
    echo "Error updating tenDangNhap: " . $e->getMessage() . "\n";
}
