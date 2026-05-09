# Quan-ly-shop-kid-s-city
/kids-city-management
│
├── /backend                      # ⚙️ MÃ NGUỒN PHP (API & XỬ LÝ DỮ LIỆU)
│   ├── /config
│   │   └── database.php          # Kết nối MySQL bằng PDO
│   ├── /core
│   │   ├── jwt.php               # Mã hóa/Giải mã Token đăng nhập
│   │   ├── middleware.php        # Kiểm tra Role (Chủ shop / Nhân viên)
│   │   └── response.php          # Hàm chuẩn hóa kết quả trả về dạng JSON
│   ├── /models                   # Lớp tương tác CSDL (Thực thi câu lệnh SQL)
│   │   ├── User.php              # Xử lý bảng users
│   │   ├── Product.php           # Xử lý bảng products, categories
│   │   ├── Order.php             # Xử lý bảng orders, order_details
│   │   └── Customer.php          # Xử lý bảng customers
│   └── /api                      # Các Endpoint nhận Request từ Frontend
│       ├── /auth
│       │   └── login.php         # API Đăng nhập
│       ├── /dashboard
│       │   ├── stats.php         # API lấy 4 cục thống kê trên cùng (Doanh thu, Đơn mới...)
│       │   ├── recent_orders.php # API lấy danh sách "Đơn hàng gần đây"
│       │   └── top_products.php  # API lấy "Top 5 sản phẩm bán chạy"
│       ├── /users                # Nhóm API Quản lý người dùng
│       ├── /imports              # Nhóm API Quản lý nhập hàng
│       ├── /products             
│       │   ├── categories.php    # API Danh mục
│       │   └── items.php         # API Sản phẩm
│       ├── /sales
│       │   ├── invoices.php      # API Hóa đơn
│       │   ├── exchanges.php     # API Đổi hàng
│       │   └── returns.php       # API Trả hàng
│       ├── /customers            # Nhóm API Quản lý khách hàng
│       └── /reports              
│           ├── revenue.php       # API Báo cáo doanh thu
│           ├── products.php      # API Báo cáo sản phẩm
│           └── customers.php     # API Báo cáo khách hàng
│
├── /frontend                     # 🎨 GIAO DIỆN HTML/CSS/JS (SPA)
│   ├── index.html                # FILE GỐC: Chứa Layout (Sidebar trái, Header trên, vùng nội dung giữa)
│   ├── login.html                # Trang đăng nhập riêng biệt
│   │
│   ├── /assets
│   │   ├── /css
│   │   │   ├── global.css        # CSS reset, font chữ, màu sắc chung
│   │   │   ├── layout.css        # CSS cho Sidebar, Header
│   │   │   ├── components.css    # CSS cho Table, Card (như 4 thẻ thống kê), Buttons, Status Badge
│   │   │   └── login.css
│   │   ├── /images               # Logo Kid's City, Avatar default
│   │   └── /libs                 # Thư viện ngoài (Chart.js, Boxicons)
│   │
│   ├── /js
│   │   ├── /core
│   │   │   ├── api.js            # Hàm gọi Fetch API chung (tự động gắn token)
│   │   │   ├── auth.js           # Xử lý đăng nhập, logout, phân quyền menu
│   │   │   └── router.js         # Bắt sự kiện click menu -> load HTML tương ứng vào màn hình
│   │   └── /controllers          # Code xử lý logic cho từng trang
│   │       ├── dashboard.js      # Gọi API hiển thị thống kê, đơn gần đây
│   │       ├── users.js
│   │       ├── imports.js
│   │       ├── products.js       # Xử lý cả danh mục và danh sách SP
│   │       ├── sales.js          # Xử lý hóa đơn, đổi, trả
│   │       ├── customers.js
│   │       └── reports.js
│   │
│   └── /views                    # CÁC MẢNH HTML (Chỉ chứa nội dung, không có thẻ <html><body>)
│       ├── dashboard.html        # Giao diện "Chào mừng trở lại..."
│       ├── users.html
│       ├── imports.html
│       ├── /products
│       │   ├── categories.html
│       │   └── list.html
│       ├── /sales
│       │   ├── invoices.html
│       │   ├── exchanges.html
│       │   └── returns.html
│       ├── customers.html
│       └── /reports
│           ├── revenue.html
│           ├── products.html
│           └── customers.html
│
└── database.sql                  # File thiết kế CSDL (Tables: users, products, orders...)