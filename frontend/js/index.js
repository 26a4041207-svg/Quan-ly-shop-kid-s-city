document.addEventListener("DOMContentLoaded", () => {
    // 0. CẬP NHẬT TÊN HIỂN THỊ TỪ LOCALSTORAGE
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        // Cập nhật tên ở các vị trí nếu muốn (Optional)
        const profileUser = document.getElementById('profile-username');
        if(profileUser) profileUser.innerText = currentUser;
    }

    // 1. CHUYỂN TRANG (SPA ROUTING)
    const loadPage = async (page) => {
        const content = document.getElementById('main-content');
        try {
            const res = await fetch(`views/${page}.html`);
            if (!res.ok) throw new Error();
            content.innerHTML = await res.text();
        } catch {
            content.innerHTML = `<div style="background: white; padding: 30px; border-radius: 15px;"><h2>Trang đang cập nhật...</h2></div>`;
        }
    };
    loadPage('dashboard');

    // 2. SIDEBAR MENU TOGGLE & ACTIVE
    document.querySelectorAll('.menu-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.parentElement.classList.toggle('open');
        });
    });

    document.querySelectorAll('.menu-item > a').forEach(link => {
        link.addEventListener('click', function() {
            if(!this.classList.contains('menu-toggle')) {
                document.querySelectorAll('.menu-item').forEach(li => li.classList.remove('active'));
                this.parentElement.classList.add('active');
            }
        });
    });

    // 3. DROPDOWNS (User & Notifications)
    const userDrop = document.getElementById('user-dropdown');
    const notiDrop = document.getElementById('notification-dropdown');

    const closeAllDropdowns = () => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    };

    userDrop.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = userDrop.querySelector('.dropdown-menu');
        const isShowing = menu.classList.contains('show');
        closeAllDropdowns();
        if (!isShowing) menu.classList.add('show');
    });

    notiDrop.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = notiDrop.querySelector('.dropdown-menu');
        const isShowing = menu.classList.contains('show');
        closeAllDropdowns();
        if (!isShowing) menu.classList.add('show');
        
        // Ẩn chấm đỏ khi click xem thông báo
        const dot = notiDrop.querySelector('.badge-dot');
        if (dot) dot.style.display = 'none';
    });

    // 4. MODALS
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

    // 5. ĐĂNG XUẤT (LOGOUT LỖI TỪ LOCALSTORAGE VÀ CHUYỂN TRANG)
    const logoutBtn = document.querySelector('.logout-item');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
        });
    }

    // 6. CLICK OUTSIDE
    window.addEventListener('click', (e) => {
        closeAllDropdowns();
        if (e.target.classList.contains('modal-overlay')) {
            profileModal.classList.remove('active');
            passwordModal.classList.remove('active');
        }
    });
});