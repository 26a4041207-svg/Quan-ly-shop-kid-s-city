# Backend Kid's City

Backend dùng PHP thuần + MySQL, không cần Composer.

## Cài đặt nhanh với XAMPP

1. Mở XAMPP và bật Apache + MySQL.
2. Import file `database.sql` vào MySQL/phpMyAdmin.
3. Kiểm tra cấu hình trong `backend/config/database.php`:
   - Database: `kids_city`
   - User: `root`
   - Password: rỗng theo mặc định XAMPP
4. Mở frontend qua server, ví dụ:
   - `http://127.0.0.1/Quan-ly-shop-kid-s-city/frontend/login.html`

## Tài khoản mẫu

- Chủ shop: `0901234567` / `admin123`
- Nhân viên: `0912345678` / `staff123`

## API chính

- `POST backend/api/auth/login.php`
- `POST backend/api/auth/logout.php`
- `GET backend/api/auth/me.php`
- `POST backend/api/auth/change_password.php`
- `GET|POST|PUT|DELETE backend/api/users/index.php`
- `GET|POST|PUT|DELETE backend/api/products/categories.php`
- `GET|POST|PUT|DELETE backend/api/products/items.php`
- `GET|POST|PUT|DELETE backend/api/customers/index.php`
- `GET|POST|PUT|DELETE backend/api/imports/index.php`
- `GET|POST|PUT|DELETE backend/api/sales/invoices.php`
- `GET|POST|PUT|DELETE backend/api/sales/exchanges.php`
- `GET|POST|PUT|DELETE backend/api/sales/returns.php`
- `GET backend/api/dashboard/stats.php`
- `GET backend/api/dashboard/recent_orders.php`
- `GET backend/api/dashboard/top_products.php`
- `GET backend/api/reports/revenue.php`
- `GET backend/api/reports/products.php`
- `GET backend/api/reports/customers.php`

Các API sau đăng nhập cần header:

```http
Authorization: Bearer <token>
```
