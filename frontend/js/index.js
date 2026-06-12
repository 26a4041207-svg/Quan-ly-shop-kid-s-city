document.addEventListener("DOMContentLoaded", () => {
    // 0. CẬP NHẬT TÊN HIỂN THỊ TỪ LOCALSTORAGE
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        let displayName = currentUser;
        try {
            const parsedUser = JSON.parse(currentUser);
            displayName = parsedUser.fullname || parsedUser.fullName || parsedUser.name || parsedUser.username || currentUser;
        } catch {
            displayName = currentUser;
        }
        const profileUser = document.getElementById('profile-username');
        if (profileUser) profileUser.innerText = displayName;
    }
    // 1. CHUYỂN TRANG (SPA ROUTING)
    const loadPage = async (page) => {
        const content = document.getElementById('main-content');
        try {
            const res = await fetch(`views/${page}.html?v=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error();
            content.innerHTML = await res.text();
            window.resetKidCitySearchInputs?.(content);
            if (window.initDashboardPage) window.initDashboardPage(content);
            if (window.initSalePage) window.initSalePage(content);
            if (window.initImportPage) window.initImportPage(content);
        } catch {
            content.innerHTML = `<div style="background: white; padding: 30px; border-radius: 15px;"><h2>Trang đang cập nhật...</h2></div>`;
        }
    };
    const initialPage = window.location.hash ? window.location.hash.slice(1) : 'dashboard';
    loadPage(initialPage);

    // 2. SIDEBAR MENU TOGGLE & ACTIVE
    document.querySelectorAll('.menu-toggle').forEach(btn => {
        if (btn.dataset.kidCityMenuBound === 'true') return;
        btn.dataset.kidCityMenuBound = 'true';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const menuItem = btn.closest('.menu-item');
            if (!menuItem) return;

            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.submenu a').forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.submenu-active').forEach(item => item.classList.remove('submenu-active'));

            menuItem.classList.add('active');
            menuItem.classList.toggle('open');
        });
    });

    const setActiveMenu = (link) => {
        // Chỉ cập nhật tab đang chọn, không đóng các nhóm menu người dùng đã mở.
        document.querySelectorAll('.menu-item').forEach(li => li.classList.remove('active'));
        document.querySelectorAll('.submenu a').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.submenu-active').forEach(item => item.classList.remove('submenu-active'));

        const currentItem = link.closest('.menu-item');
        if (currentItem) {
            currentItem.classList.add('active');
            if (currentItem.classList.contains('has-submenu')) {
                currentItem.classList.add('open');
            }
        }

        const currentSubmenu = link.closest('.submenu');
        if (currentSubmenu) {
            link.classList.add('active');
            link.closest('li')?.classList.add('submenu-active');
            const parentItem = currentSubmenu.closest('.menu-item');
            if (parentItem) parentItem.classList.add('open');
        }
    };

    document.querySelectorAll('[data-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.location.hash !== '#' + link.dataset.target) {
                history.pushState(null, '', '#' + link.dataset.target);
            }
            loadPage(link.dataset.target);
            setActiveMenu(link);
        });
    });

    document.querySelectorAll('.menu-item > a:not([data-target])').forEach(link => {
        link.addEventListener('click', function() {
            if (!this.classList.contains('menu-toggle')) setActiveMenu(this);
        });
    });

    document.querySelectorAll('.submenu a:not([data-target])').forEach(link => {
        link.addEventListener('click', function() {
            setActiveMenu(this);
        });
    });

    const initialActiveLink = document.querySelector(`[data-target="${initialPage}"]`);
    if (initialActiveLink) setActiveMenu(initialActiveLink);

    window.addEventListener('hashchange', () => {
        const page = window.location.hash ? window.location.hash.slice(1) : 'dashboard';
        loadPage(page);
        const link = document.querySelector(`[data-target="${page}"]`);
        if (link) setActiveMenu(link);
    });
    // 3. DROPDOWNS (User & Notifications)
    const userDrop = document.getElementById('user-dropdown');
    const notiDrop = document.getElementById('notification-dropdown');

    const closeAllDropdowns = () => {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    };

    if (userDrop && userDrop.dataset.kidCityDropdownBound !== 'true') {
        userDrop.dataset.kidCityDropdownBound = 'true';
    userDrop.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = userDrop.querySelector('.dropdown-menu');
        const isShowing = menu.classList.contains('show');
        closeAllDropdowns();
        if (!isShowing) menu.classList.add('show');
    });
    }

    if (notiDrop && notiDrop.dataset.kidCityDropdownBound !== 'true') {
        notiDrop.dataset.kidCityDropdownBound = 'true';
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
    }

    // 4. MODALS
    const profileModal = document.getElementById('modal-profile');
    const passwordModal = document.getElementById('modal-password');

    document.getElementById('open-profile').addEventListener('click', () => profileModal.classList.add('active'));
    document.getElementById('open-password').addEventListener('click', () => {
        clearPasswordForm();
        passwordModal.classList.add('active');
        setTimeout(clearPasswordForm, 0);
    });

    const clearPasswordForm = () => {
        passwordModal.querySelectorAll('input[type="password"]').forEach(input => {
            input.value = '';
            input.classList.remove('input-error');
        });
        const error = document.getElementById('password-match-error');
        if (error) {
            error.textContent = '';
            error.classList.remove('show');
        }
    };

    const showPasswordError = (message) => {
        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-new-password');
        const error = document.getElementById('password-match-error');

        newPasswordInput?.classList.add('input-error');
        confirmPasswordInput?.classList.add('input-error');
        if (error) {
            error.textContent = message;
            error.classList.add('show');
        }
    };

    const clearPasswordError = () => {
        document.getElementById('new-password')?.classList.remove('input-error');
        document.getElementById('confirm-new-password')?.classList.remove('input-error');
        const error = document.getElementById('password-match-error');
        if (error) {
            error.textContent = '';
            error.classList.remove('show');
        }
    };

    ['new-password', 'confirm-new-password'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', clearPasswordError);
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            profileModal.classList.remove('active');
            passwordModal.classList.remove('active');
            clearPasswordForm();
        });
    });

    const savePasswordBtn = document.getElementById('save-password-change');
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', async () => {
            const newPassword = document.getElementById('new-password')?.value.trim();
            const confirmNewPassword = document.getElementById('confirm-new-password')?.value.trim();

            if (!newPassword || !confirmNewPassword) {
                showPasswordError('Vui lòng nhập đầy đủ mật khẩu mới và xác nhận lại mật khẩu mới.');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                showPasswordError('Mật khẩu mới và xác nhận lại mật khẩu mới phải giống nhau.');
                document.getElementById('confirm-new-password')?.focus();
                return;
            }

            clearPasswordError();
            try {
                await window.kidCityApi.post('auth/change_password.php', {
                    newPassword,
                    confirmNewPassword
                });
                alert('Đổi mật khẩu thành công!');
                
                // Unblock UI if it was first login
                const currentUserStr = localStorage.getItem("currentUser");
                if (currentUserStr) {
                    try {
                        const user = JSON.parse(currentUserStr);
                        user.is_first_login = false;
                        localStorage.setItem("currentUser", JSON.stringify(user));
                    } catch(e) {}
                }
                
                passwordModal.style.pointerEvents = '';
                const modalContent = passwordModal.querySelector('.modal-content');
                if (modalContent) modalContent.style.pointerEvents = '';
                const closeBtns = passwordModal.querySelectorAll('.close-modal');
                closeBtns.forEach(btn => btn.style.display = '');
                const headerText = passwordModal.querySelector('.modal-header h3');
                if (headerText) headerText.textContent = 'Đổi mật khẩu';

                passwordModal.classList.remove('active');
                clearPasswordForm();
            } catch (error) {
                showPasswordError(error.message || 'Không thể đổi mật khẩu.');
            }
        });
    }

    // 5. ĐĂNG XUẤT (LOGOUT LỖI TỪ LOCALSTORAGE VÀ CHUYỂN TRANG)
    const logoutBtn = document.querySelector('.logout-item');
    if (logoutBtn && logoutBtn.dataset.kidCityLogoutBound !== 'true') {
        logoutBtn.dataset.kidCityLogoutBound = 'true';
        logoutBtn.addEventListener('click', () => {
            if(confirm("Bạn có chắc chắn muốn đăng xuất?")) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentRole');
                localStorage.removeItem('authToken');
                window.location.href = window.getKidCityLoginPath ? window.getKidCityLoginPath() : './login.html';
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
