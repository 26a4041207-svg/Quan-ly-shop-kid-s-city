CREATE DATABASE IF NOT EXISTS kids_city
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE kids_city;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS api_tokens;
DROP TABLE IF EXISTS returns;
DROP TABLE IF EXISTS exchanges;
DROP TABLE IF EXISTS invoice_details;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS import_details;
DROP TABLE IF EXISTS import_receipts;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) DEFAULT '',
    phone VARCHAR(20) NOT NULL UNIQUE,
    cccd VARCHAR(20) DEFAULT '',
    address VARCHAR(255) DEFAULT '',
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    status ENUM('Đã kích hoạt', 'Chưa kích hoạt', 'Khóa') NOT NULL DEFAULT 'Chưa kích hoạt',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE api_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    status ENUM('Đang bán', 'Ngừng bán') NOT NULL DEFAULT 'Đang bán',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    category_id INT NULL,
    name VARCHAR(200) NOT NULL,
    size VARCHAR(50) DEFAULT '',
    color VARCHAR(80) DEFAULT '',
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    import_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    image MEDIUMTEXT,
    status ENUM('Đang bán', 'Ngừng bán') NOT NULL DEFAULT 'Đang bán',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(150) DEFAULT '',
    address VARCHAR(255) DEFAULT '',
    gender VARCHAR(20) DEFAULT '',
    birthday DATE NULL,
    note TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE import_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    supplier VARCHAR(200) NOT NULL,
    staff_id INT NULL,
    import_date DATE NOT NULL,
    note TEXT,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_imports_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE import_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    import_id INT NOT NULL,
    product_id INT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_import_details_import FOREIGN KEY (import_id) REFERENCES import_receipts(id) ON DELETE CASCADE,
    CONSTRAINT fk_import_details_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT NULL,
    staff_id INT NULL,
    invoice_date DATE NOT NULL,
    note TEXT,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('Hoàn thành', 'Đã hủy') NOT NULL DEFAULT 'Hoàn thành',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    CONSTRAINT fk_invoices_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invoice_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_invoice_details_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_details_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE exchanges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    invoice_id INT NULL,
    staff_id INT NULL,
    exchange_date DATE NOT NULL,
    old_product_id INT NULL,
    new_product_id INT NULL,
    quantity INT NOT NULL DEFAULT 1,
    reason VARCHAR(255) DEFAULT '',
    type VARCHAR(50) NOT NULL DEFAULT 'Đổi hàng',
    status ENUM('Hoàn thành', 'Đã hủy') NOT NULL DEFAULT 'Hoàn thành',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_exchanges_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    CONSTRAINT fk_exchanges_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_exchanges_old_product FOREIGN KEY (old_product_id) REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_exchanges_new_product FOREIGN KEY (new_product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE returns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    invoice_id INT NULL,
    product_id INT NULL,
    staff_id INT NULL,
    return_date DATE NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    refund_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    reason VARCHAR(255) DEFAULT '',
    status ENUM('Hoàn thành', 'Đã hủy') NOT NULL DEFAULT 'Hoàn thành',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_returns_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    CONSTRAINT fk_returns_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    CONSTRAINT fk_returns_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, password_hash, name, email, phone, cccd, address, role, status) VALUES
('0901234567', 'admin123', 'Nguyễn Văn An', 'admin@kidscity.vn', '0901234567', '001200000001', 'Hà Nội', 'admin', 'Đã kích hoạt'),
('0912345678', 'staff123', 'Trần Thị Bình', 'binh@kidscity.vn', '0912345678', '001200000002', 'Hà Nội', 'staff', 'Đã kích hoạt'),
('0934567890', 'staff123', 'Phạm Thị Dung', 'dung@kidscity.vn', '0934567890', '001200000003', 'Hà Nội', 'staff', 'Đã kích hoạt'),
('0945678901', 'staff123', 'Hoàng Văn Em', 'em@kidscity.vn', '0945678901', '001200000004', 'Hà Nội', 'staff', 'Chưa kích hoạt');

INSERT INTO categories (code, name, description, status) VALUES
('DM001', 'Áo thun', 'Áo thun trẻ em', 'Đang bán'),
('DM002', 'Váy bé gái', 'Váy và đầm cho bé gái', 'Đang bán'),
('DM003', 'Quần short', 'Quần short bé trai/bé gái', 'Đang bán'),
('DM004', 'Bộ đồ', 'Bộ đồ trẻ em', 'Đang bán'),
('DM005', 'Giày dép', 'Giày dép trẻ em', 'Đang bán'),
('DM006', 'Phụ kiện', 'Phụ kiện thời trang trẻ em', 'Đang bán'),
('DM007', 'Đồ chơi', 'Đồ chơi trẻ em', 'Đang bán');

INSERT INTO products (code, category_id, name, size, color, price, import_price, stock, status) VALUES
('SP001', 1, 'Áo thun Mickey Mouse', 'M', 'Đỏ', 120000, 80000, 24, 'Đang bán'),
('SP002', 1, 'Áo thun Elsa Frozen', 'S', 'Hồng', 135000, 90000, 18, 'Đang bán'),
('SP003', 2, 'Váy hoa nhí công chúa', 'M', 'Vàng', 220000, 150000, 3, 'Đang bán'),
('SP004', 3, 'Quần short bé trai', 'L', 'Đen', 200000, 130000, 5, 'Đang bán'),
('SP005', 4, 'Bộ đồ bé trai', 'M', 'Xanh dương', 280000, 180000, 12, 'Đang bán'),
('SP006', 2, 'Đầm công chúa', 'L', 'Trắng', 360000, 240000, 7, 'Đang bán'),
('SP007', 5, 'Giày trẻ em', '28', 'Trắng', 290000, 190000, 10, 'Đang bán'),
('SP008', 6, 'Mũ trẻ em', 'Free Size', 'Xanh nhạt', 90000, 50000, 22, 'Đang bán'),
('SP009', 6, 'Balo trẻ em', 'Free Size', 'Xanh dương', 260000, 170000, 8, 'Đang bán'),
('SP010', 1, 'Áo khoác trẻ em', 'L', 'Đỏ đô', 300000, 210000, 4, 'Đang bán'),
('SP011', 7, 'Đồ chơi trẻ em', 'Free Size', 'Nhiều màu', 310000, 200000, 16, 'Đang bán'),
('SP012', 3, 'Quần jean trẻ em', 'M', 'Xanh nhạt', 245000, 160000, 9, 'Đang bán'),
('SP013', 6, 'Phụ kiện tóc', 'Free Size', 'Hồng', 85000, 45000, 30, 'Đang bán');

INSERT INTO customers (code, name, phone, email, address, gender, birthday, note) VALUES
('KH001', 'Lê Thị Cẩm Ly', '0981000001', 'camly@example.com', 'Hà Nội', 'Nữ', '1995-05-12', 'Khách hàng quen'),
('KH002', 'Phạm Văn Dũng', '0981000002', 'dung@example.com', 'Hà Nội', 'Nam', '1992-08-20', 'Đơn online'),
('KH003', 'Hoàng Thị Mai', '0981000003', 'mai@example.com', 'Hà Nội', 'Nữ', '1997-11-03', ''),
('KH004', 'Nguyễn Minh Nhật', '0981000004', 'nhat@example.com', 'Hà Nội', 'Nam', '1990-01-15', ''),
('KH005', 'Trần Thu Hà', '0981000005', 'ha@example.com', 'Hà Nội', 'Nữ', '1998-04-18', 'Khách thân thiết');

INSERT INTO import_receipts (code, supplier, staff_id, import_date, note, total) VALUES
('NH001', 'Công ty May Trẻ Em ABC', 1, '2026-05-01', 'Nhập hàng đầu tháng', 3950000),
('NH002', 'Kho Sỉ Kid Fashion', 2, '2026-05-10', 'Bổ sung hàng bán chạy', 2700000);

INSERT INTO import_details (import_id, product_id, quantity, price, line_total) VALUES
(1, 1, 20, 80000, 1600000),
(1, 2, 15, 90000, 1350000),
(1, 8, 20, 50000, 1000000),
(2, 3, 10, 150000, 1500000),
(2, 5, 5, 180000, 900000),
(2, 13, 5, 60000, 300000);

INSERT INTO invoices (code, customer_id, staff_id, invoice_date, note, discount, total) VALUES
('HD001', 1, 2, '2026-04-15', 'Khách hàng quen', 0, 375000),
('HD002', 2, 2, '2026-04-16', 'Đơn online', 0, 220000),
('HD003', 3, 3, '2026-04-18', 'Mua tại cửa hàng', 0, 545000),
('HD004', 4, 2, '2026-04-20', 'Khách đổi size nếu không vừa', 0, 320000),
('HD005', 5, 3, '2026-04-22', 'Khách thân thiết', 0, 490000);

INSERT INTO invoice_details (invoice_id, product_id, quantity, price, discount, line_total) VALUES
(1, 1, 2, 120000, 0, 240000),
(1, 2, 1, 135000, 0, 135000),
(2, 3, 1, 220000, 0, 220000),
(3, 1, 2, 120000, 0, 240000),
(3, 3, 1, 220000, 0, 220000),
(3, 13, 1, 85000, 0, 85000),
(4, 1, 1, 120000, 0, 120000),
(4, 4, 1, 200000, 0, 200000),
(5, 2, 2, 135000, 0, 270000),
(5, 3, 1, 220000, 0, 220000);

INSERT INTO exchanges (code, invoice_id, staff_id, exchange_date, old_product_id, new_product_id, quantity, reason, type) VALUES
('DH001', 1, 2, '2026-04-18', 1, 2, 1, 'Đổi sang mẫu khác', 'Đổi hàng'),
('DH002', 3, 3, '2026-04-20', 13, 8, 1, 'Đổi phụ kiện', 'Đổi hàng');

INSERT INTO returns (code, invoice_id, product_id, staff_id, return_date, quantity, refund_amount, reason) VALUES
('TH001', 2, 3, 2, '2026-04-18', 1, 220000, 'Khách trả hàng'),
('TH002', 4, 4, 2, '2026-04-22', 1, 200000, 'Không vừa size');
