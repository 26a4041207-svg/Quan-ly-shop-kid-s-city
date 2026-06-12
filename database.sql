CREATE DATABASE IF NOT EXISTS kids_city CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kids_city;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS api_tokens;
DROP TABLE IF EXISTS ChiTietDoiHang;
DROP TABLE IF EXISTS DoiHang;
DROP TABLE IF EXISTS ChiTietTraHang;
DROP TABLE IF EXISTS TraHang;
DROP TABLE IF EXISTS ChiTietHangNhap;
DROP TABLE IF EXISTS HangNhap;
DROP TABLE IF EXISTS ChiTietHoaDon;
DROP TABLE IF EXISTS HoaDon;
DROP TABLE IF EXISTS SanPham;
DROP TABLE IF EXISTS DanhMucSP;
DROP TABLE IF EXISTS NguoiDung;
DROP TABLE IF EXISTS KhachHang;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE KhachHang (
    maKhachHang INT AUTO_INCREMENT PRIMARY KEY,
    tenKhachHang VARCHAR(100) NOT NULL,
    soDienThoai VARCHAR(15) NOT NULL UNIQUE,
    ngayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE NguoiDung (
    maNguoiDung INT AUTO_INCREMENT PRIMARY KEY,
    tenNguoiDung VARCHAR(100) NOT NULL,
    tenDangNhap VARCHAR(100) NOT NULL UNIQUE,
    soDienThoai VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    anhCCCD MEDIUMTEXT NOT NULL,
    matKhau VARCHAR(255) NOT NULL,
    vaiTro ENUM('chushop','nhanvien') NOT NULL,
    trangThai TINYINT(1) DEFAULT 1,
    lanDangNhapDau TINYINT(1) DEFAULT 1,
    matKhauBanDau VARCHAR(20) NULL,
    reset_otp VARCHAR(10) NULL,
    otp_expires_at DATETIME NULL,
    ngayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE api_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES NguoiDung(maNguoiDung) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE DanhMucSP (
    maDanhMuc INT AUTO_INCREMENT PRIMARY KEY,
    tenDanhMuc VARCHAR(100) NOT NULL UNIQUE,
    moTa TEXT NULL,
    ngayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE SanPham (
    maSanPham INT AUTO_INCREMENT PRIMARY KEY,
    tenSanPham VARCHAR(150) NOT NULL,
    anh MEDIUMTEXT NULL,
    size VARCHAR(10) NOT NULL,
    mauSac VARCHAR(50) NOT NULL,
    giaBan DECIMAL(12,2) NOT NULL CHECK (giaBan >= 0),
    soLuong INT DEFAULT 0 CHECK (soLuong >= 0),
    maDanhMuc INT NOT NULL,
    ngayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sp_dm FOREIGN KEY (maDanhMuc)
       REFERENCES DanhMucSP(maDanhMuc)
);

CREATE TABLE HoaDon (
    maHoaDon INT AUTO_INCREMENT PRIMARY KEY,
    maKhachHang INT NULL,
    maNguoiDung INT NOT NULL,
    tongTien DECIMAL(12,2) NOT NULL CHECK (tongTien >= 0),
    ngayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ghiChu TEXT NULL,
    CONSTRAINT fk_hd_kh FOREIGN KEY (maKhachHang)
        REFERENCES KhachHang(maKhachHang),
    CONSTRAINT fk_hd_nd FOREIGN KEY (maNguoiDung)
        REFERENCES NguoiDung(maNguoiDung)
);

CREATE TABLE ChiTietHoaDon (
    maHoaDon INT NOT NULL,
    maSanPham INT NOT NULL,
    soLuong INT NOT NULL CHECK (soLuong > 0),
    donGia DECIMAL(12,2) NOT NULL CHECK (donGia >= 0),
    giamGia DECIMAL(5,2) DEFAULT 0,
    thanhTien DECIMAL(12,2) NOT NULL CHECK (thanhTien >= 0),
    PRIMARY KEY (maHoaDon, maSanPham),
    FOREIGN KEY (maHoaDon) REFERENCES HoaDon(maHoaDon),
    FOREIGN KEY (maSanPham) REFERENCES SanPham(maSanPham)
);

CREATE TABLE HangNhap (
    maHangNhap INT AUTO_INCREMENT PRIMARY KEY,
    maNguoiDung INT NOT NULL,
    nhaCungCap VARCHAR(50) NOT NULL,
    ngayNhap DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ghiChu TEXT NULL,
    FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung)
);

CREATE TABLE ChiTietHangNhap (
    maHangNhap INT NOT NULL,
    maSanPham INT NOT NULL,
    soLuongNhap INT NOT NULL CHECK (soLuongNhap > 0),
    PRIMARY KEY (maHangNhap, maSanPham),
    FOREIGN KEY (maHangNhap) REFERENCES HangNhap(maHangNhap),
    FOREIGN KEY (maSanPham) REFERENCES SanPham(maSanPham)
);

CREATE TABLE TraHang (
    maTraHang INT AUTO_INCREMENT PRIMARY KEY,
    maHoaDon INT NOT NULL,
    maNguoiDung INT NOT NULL,
    ngayTra DATETIME DEFAULT CURRENT_TIMESTAMP,
	ngayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lyDo TEXT NOT NULL,
    tongTienHoan DECIMAL(12,2) NOT NULL CHECK (tongTienHoan >= 0),
    FOREIGN KEY (maHoaDon) REFERENCES HoaDon(maHoaDon),
    FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung)
);

CREATE TABLE ChiTietTraHang (
    maTraHang INT NOT NULL,
    maSanPham INT NOT NULL,
    soLuongTra INT NOT NULL CHECK (soLuongTra > 0),
    thanhTienHoan DECIMAL(12,2) NOT NULL CHECK (thanhTienHoan >= 0),
    PRIMARY KEY (maTraHang, maSanPham),
    FOREIGN KEY (maTraHang) REFERENCES TraHang(maTraHang),
    FOREIGN KEY (maSanPham) REFERENCES SanPham(maSanPham)
);

CREATE TABLE DoiHang (
    maDoiHang INT AUTO_INCREMENT PRIMARY KEY,
    maHoaDon INT NOT NULL,
    maNguoiDung INT NOT NULL,
    ngayDoi DATETIME DEFAULT CURRENT_TIMESTAMP,
	ngayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lyDo TEXT NOT NULL,
    tienBu DECIMAL(12,2) DEFAULT 0 CHECK (tienBu >= 0),
    tienHoan DECIMAL(12,2) DEFAULT 0 CHECK (tienHoan >= 0),
    FOREIGN KEY (maHoaDon) REFERENCES HoaDon(maHoaDon),
    FOREIGN KEY (maNguoiDung) REFERENCES NguoiDung(maNguoiDung)
);

CREATE TABLE ChiTietDoiHang (
    maDoiHang INT NOT NULL,
    maSanPhamCu INT NOT NULL,
    maSanPhamMoi INT NOT NULL,
    soLuong INT NOT NULL CHECK (soLuong > 0),
    PRIMARY KEY (maDoiHang, maSanPhamCu, maSanPhamMoi),
    FOREIGN KEY (maDoiHang) REFERENCES DoiHang(maDoiHang),
    FOREIGN KEY (maSanPhamCu) REFERENCES SanPham(maSanPham),
    FOREIGN KEY (maSanPhamMoi) REFERENCES SanPham(maSanPham)
);

INSERT INTO NguoiDung
(tenNguoiDung,tenDangNhap,soDienThoai,email,anhCCCD,matKhau,vaiTro,trangThai)
VALUES
('Lê Văn Hùng','hungadmin','0901000001','hung@kidscity.vn','cccd_hung.jpg','123456','chushop',1),
('Nguyễn Thị Lan','lan01','0901000002','lan@kidscity.vn','cccd_lan.jpg','123456','nhanvien',1),
('Trần Minh Đức','duc01','0901000003','duc@kidscity.vn','cccd_duc.jpg','123456','nhanvien',1),
('Phạm Thu Hà','ha01','0901000004','ha@kidscity.vn','cccd_ha.jpg','123456','nhanvien',1),
('Đỗ Quang Anh','anh01','0901000005','anh@kidscity.vn','cccd_anh.jpg','123456','nhanvien',1);

INSERT INTO DanhMucSP(tenDanhMuc,moTa) VALUES
('Áo bé trai','Áo cho bé trai'),
('Áo bé gái','Áo cho bé gái'),
('Quần bé trai','Quần cho bé trai'),
('Quần bé gái','Quần cho bé gái'),
('Váy bé gái','Váy bé gái'),
('Đồ sơ sinh','Đồ sơ sinh'),
('Đồ bộ trẻ em','Đồ bộ trẻ em'),
('Phụ kiện trẻ em','Phụ kiện');

INSERT INTO KhachHang(tenKhachHang,soDienThoai) VALUES
('Nguyễn Minh Anh','0911110001'),
('Trần Gia Hân','0911110002'),
('Lê Bảo Ngọc','0911110003'),
('Phạm Đức Anh','0911110004'),
('Hoàng Khánh Linh','0911110005'),
('Đặng Gia Bảo','0911110006'),
('Vũ Minh Khang','0911110007'),
('Ngô Nhật Minh','0911110008'),
('Đỗ Anh Thư','0911110009'),
('Bùi Hải Yến','0911110010');

INSERT INTO SanPham
(tenSanPham,anh,size,mauSac,giaBan,soLuong,maDanhMuc)
VALUES
('Áo thun khủng long bé trai',NULL,'100','Xanh Navy',149000,40,1),
('Áo thun khủng long bé trai',NULL,'110','Xanh Navy',149000,35,1),
('Áo polo bé trai',NULL,'120','Trắng',199000,25,1),
('Quần jean bé trai',NULL,'110','Xanh',229000,30,3),
('Quần kaki bé trai',NULL,'120','Be',219000,28,3),
('Váy công chúa Elsa',NULL,'110','Hồng',299000,20,5),
('Váy hoa nhí bé gái',NULL,'120','Kem',249000,25,5),
('Áo kiểu bé gái',NULL,'120','Hồng',179000,22,2),
('Bộ ngủ cotton',NULL,'130','Tím',259000,18,7),
('Mũ lưỡi trai Kids City',NULL,'M','Đỏ',99000,40,8),
('Tất cotton trẻ em',NULL,'S','Trắng',39000,100,8),
('Body sơ sinh gấu nâu',NULL,'66','Nâu',129000,50,6);

INSERT INTO HangNhap(maNguoiDung,nhaCungCap,ghiChu) VALUES
(1,'Công Ty May Trẻ Em Việt','Nhập đầu tháng'),
(2,'Thiên Phúc Kids','Nhập bổ sung'),
(3,'Baby Style Việt Nam','Hàng hè');

INSERT INTO ChiTietHangNhap VALUES
(1,1,50),(1,2,50),(1,6,30),
(2,4,40),(2,5,40),(2,7,35),
(3,10,60),(3,11,150),(3,12,80);

INSERT INTO HoaDon(maKhachHang,maNguoiDung,tongTien,ghiChu) VALUES
(1,2,378000,'Mua trực tiếp'),
(2,3,299000,''),
(3,2,348000,'Khách quen'),
(4,4,258000,''),
(5,2,398000,'');

INSERT INTO ChiTietHoaDon VALUES
(1,1,1,149000,0,149000),
(1,4,1,229000,0,229000),
(2,6,1,299000,0,299000),
(3,8,1,179000,0,179000),
(3,10,1,99000,0,99000),
(3,11,2,35000,0,70000),
(4,12,2,129000,0,258000),
(5,3,1,199000,0,199000),
(5,5,1,199000,0,199000);

INSERT INTO TraHang(maHoaDon,maNguoiDung,lyDo,tongTienHoan) VALUES
(2,2,'Sai size',299000);

INSERT INTO ChiTietTraHang VALUES
(1,6,1,299000);

INSERT INTO DoiHang(maHoaDon,maNguoiDung,lyDo,tienBu,tienHoan) VALUES
(1,3,'Đổi size 100 sang 110',0,0);

INSERT INTO ChiTietDoiHang VALUES
(1,1,2,1);
