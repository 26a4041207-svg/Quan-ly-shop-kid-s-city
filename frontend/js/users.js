// ==========================================
// CÁC HÀM TIỆN ÍCH DÙNG CHUNG TOÀN HỆ THỐNG
// ==========================================

// 1. Quản lý Modal (Popup)
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
};

// Đóng modal khi click ra vùng đen bên ngoài
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.classList.remove('active');
    }
});

// 2. Hệ thống Toast Notification
// Tạo div chứa toast nếu chưa có
if (!document.getElementById('global-toast')) {
    const toastDiv = document.createElement('div');
    toastDiv.id = 'global-toast';
    toastDiv.innerHTML = `<i class='bx bx-check-circle'></i> <span id="toast-message">Thành công!</span>`;
    document.body.appendChild(toastDiv);
}

window.showToast = function(message) {
    const toast = document.getElementById('global-toast');
    const toastMsg = document.getElementById('toast-message');
    
    toastMsg.innerText = message;
    toast.classList.add('show');

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};
// ==========================================
// XU LY MENU VA HEADER RIENG CHO TRANG USERS
// users.html la trang day du, khong nap index.js de tranh router ghi de noi dung.
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.menu-toggle').forEach(function(btn) {
        if (btn.dataset.kidCityMenuBound === 'true') return;
        btn.dataset.kidCityMenuBound = 'true';
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const item = btn.closest('.menu-item');
            if (item) item.classList.toggle('open');
        });
    });

    const closeAllDropdowns = function() {
        document.querySelectorAll('.dropdown-menu').forEach(function(menu) {
            menu.classList.remove('show');
        });
    };

    const userDrop = document.getElementById('user-dropdown');
    const notiDrop = document.getElementById('notification-dropdown');

    if (userDrop) {
        userDrop.addEventListener('click', function(e) {
            e.stopPropagation();
            const menu = userDrop.querySelector('.dropdown-menu');
            if (!menu) return;
            const isShowing = menu.classList.contains('show');
            closeAllDropdowns();
            if (!isShowing) menu.classList.add('show');
        });
    }

    if (notiDrop) {
        notiDrop.addEventListener('click', function(e) {
            e.stopPropagation();
            const menu = notiDrop.querySelector('.dropdown-menu');
            if (!menu) return;
            const isShowing = menu.classList.contains('show');
            closeAllDropdowns();
            if (!isShowing) menu.classList.add('show');
            const dot = notiDrop.querySelector('.badge-dot');
            if (dot) dot.style.display = 'none';
        });
    }

    const profileModal = document.getElementById('modal-profile');
    const passwordModal = document.getElementById('modal-password');
    const openProfile = document.getElementById('open-profile');
    const openPassword = document.getElementById('open-password');

    if (openProfile && profileModal) {
        openProfile.addEventListener('click', function() {
            profileModal.classList.add('active');
            closeAllDropdowns();
        });
    }

    if (openPassword && passwordModal) {
        openPassword.addEventListener('click', function() {
            passwordModal.classList.add('active');
            closeAllDropdowns();
        });
    }

    document.querySelectorAll('.close-modal').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (profileModal) profileModal.classList.remove('active');
            if (passwordModal) passwordModal.classList.remove('active');
        });
    });

    const logoutBtn = document.querySelector('.logout-item');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Ban co chac chan muon dang xuat?')) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentRole');
                window.location.href = '../login.html';
            }
        });
    }

    window.addEventListener('click', function(e) {
        closeAllDropdowns();
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
            if (profileModal) profileModal.classList.remove('active');
            if (passwordModal) passwordModal.classList.remove('active');
        }
    });
});
