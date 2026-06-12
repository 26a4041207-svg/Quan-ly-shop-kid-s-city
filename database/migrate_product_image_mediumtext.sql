-- Chạy file này nếu database đã tạo trước đó (ảnh base64 bị cắt do VARCHAR(255))
ALTER TABLE products MODIFY COLUMN image MEDIUMTEXT;
