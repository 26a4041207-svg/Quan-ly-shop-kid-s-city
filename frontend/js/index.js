document.addEventListener("DOMContentLoaded", () => {
    // 1. CHUYỂN TRANG (SPA ROUTING)
    const loadPage = async (page) => {
        const content = document.getElementById('main-content');
        try {
            const res = await fetch(`views/${page}.html`);
            if (!res.ok) throw new Error();
            content.innerHTML = await res.text();
        } catch {
            content.innerHTML = "<h2>Trang đang cập nhật...</h2>";
        }
    };
    loadPage('dashboard'); // Mặc định load dashboard

    // 2. SIDEBAR MENU TOGGLE
    document.querySelectorAll('.menu-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.parentElement.classList.toggle('open');
        });
    });

    // 3. DROPDOWN HEADER
    const userDrop = document.getElementById('user-dropdown');
    userDrop.addEventListener('click', (e) => {
        e.stopPropagation();
        userDrop.querySelector('.dropdown-menu').classList.toggle('show');
    });

    // 4. MODALS (PROFILE & PASSWORD)
    const profileModal = document.getElementById('modal-profile');
    const passwordModal = document.getElementById('modal-password');

    document.getElementById('open-profile').addEventListener('click', () => profileModal.classList.add('active'));
    document.getElementById('open-password').addEventListener('click', () => passwordModal.classList.add('active'));

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            profileModal.classList.remove('active');
            passwordModal.classList.remove('active');
        });
    });

    // CLICK RA NGOÀI ĐỂ ĐÓNG TẤT CẢ
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        if (e.target.classList.contains('modal-overlay')) {
            profileModal.classList.remove('active');
            passwordModal.classList.remove('active');
        }
    });

// Xử lý Dropdown thông báo
    const notiBtn = document.getElementById('notification-dropdown');

    if (notiBtn) {
        notiBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Đóng các dropdown khác nếu đang mở
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== this.querySelector('.dropdown-menu')) {
                    menu.classList.remove('show');
                }
            });

            // Toggle menu thông báo
            this.querySelector('.dropdown-menu').classList.toggle('show');
            
            // (Tùy chọn) Ẩn chấm đỏ sau khi người dùng bấm xem
            const dot = this.querySelector('.badge-dot');
            if (dot) dot.style.display = 'none'; 
        });
    }

    // Bấm ra ngoài màn hình thì đóng menu
    window.addEventListener('click', function() {
        const menus = document.querySelectorAll('.dropdown-menu');
        menus.forEach(m => m.classList.remove('show'));
    });
});