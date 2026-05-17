(function () {
    const accounts = {
        admin: { role: 'admin', roleLabel: 'Chủ shop', name: 'Nguyễn Văn An', email: 'admin@kidscity.vn' },
        staff1: { role: 'staff', roleLabel: 'Nhân viên', name: 'Trần Thị Bình', email: 'binh@kidscity.vn' },
        staff3: { role: 'staff', roleLabel: 'Nhân viên', name: 'Phạm Thị Dung', email: 'dung@kidscity.vn' },
        staff4: { role: 'staff', roleLabel: 'Nhân viên', name: 'Hoàng Văn Em', email: 'em@kidscity.vn' }
    };

    const parseCurrentUser = () => {
        const raw = localStorage.getItem('currentUser');
        if (!raw) return { username: 'admin' };

        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed;
        } catch {
            // currentUser dang la username thuong, khong phai JSON.
        }

        return { username: raw };
    };

    const normalizeRole = (value) => {
        const role = String(value || '').toLowerCase();
        if (['staff', 'nhanvien', 'nhân viên', 'employee'].includes(role)) return 'staff';
        if (['admin', 'owner', 'chushop', 'chủ shop', 'shop-owner'].includes(role)) return 'admin';
        return '';
    };

    const getCurrentAccount = () => {
        const user = parseCurrentUser();
        const username = user.username || user.userName || user.account || user.fullname || user.name || 'admin';
        const savedRole = normalizeRole(localStorage.getItem('currentRole'));
        const objectRole = normalizeRole(user.role || user.vaiTro || user.permission || user.type);
        const fallbackRole = String(username).toLowerCase().startsWith('staff') ? 'staff' : 'admin';
        const account = accounts[username] || {};
        const role = savedRole || objectRole || account.role || fallbackRole;

        return {
            username,
            role,
            roleLabel: user.roleLabel || user.tenVaiTro || account.roleLabel || (role === 'staff' ? 'Nhân viên' : 'Chủ shop'),
            name: user.fullname || user.fullName || user.name || account.name || username,
            email: user.email || account.email || `${username}@kidscity.vn`
        };
    };

    const removeUserManagementMenu = () => {
        document.querySelectorAll('a[href$="users.html"]').forEach((link) => {
            const item = link.closest('.menu-item') || link.closest('li');
            if (item) item.remove();
        });
    };

    const updateHeaderProfile = (account) => {
        document.querySelectorAll('.header-user .user-info h4').forEach((item) => {
            item.textContent = account.name;
        });
        document.querySelectorAll('.header-user .user-info p').forEach((item) => {
            item.textContent = account.roleLabel;
        });
        document.querySelectorAll('.profile-info-header h4').forEach((item) => {
            item.textContent = account.name;
        });
        document.querySelectorAll('.profile-info-header p').forEach((item) => {
            item.textContent = account.email;
        });
        document.querySelectorAll('.badge-role').forEach((item) => {
            item.textContent = account.roleLabel;
        });
        document.querySelectorAll('.profile-details .detail-row').forEach((row) => {
            const label = row.querySelector('.label')?.textContent.trim();
            const value = row.querySelector('.value');
            if (label === 'Tên đăng nhập' && value) value.textContent = account.username;
        });
    };

    const menuStateKey = 'kidCityOpenMenus';

    const menuId = (item) => {
        const label = item.querySelector('.menu-toggle span')?.textContent.trim();
        return label || item.querySelector('.menu-toggle')?.textContent.trim() || '';
    };

    const saveOpenMenuState = () => {
        const openMenus = Array.from(document.querySelectorAll('.menu-item.has-submenu.open'))
            .map(menuId)
            .filter(Boolean);
        localStorage.setItem(menuStateKey, JSON.stringify(openMenus));
    };

    const restoreOpenMenuState = () => {
        let openMenus = [];
        try {
            openMenus = JSON.parse(localStorage.getItem(menuStateKey) || '[]');
        } catch {
            openMenus = [];
        }

        document.querySelectorAll('.menu-item.has-submenu').forEach((item) => {
            if (openMenus.includes(menuId(item))) item.classList.add('open');
        });
    };

    const bindMenuStatePersistence = () => {
        restoreOpenMenuState();
        document.querySelectorAll('.menu a').forEach((link) => {
            link.addEventListener('click', () => {
                if (link.classList.contains('menu-toggle')) {
                    setTimeout(saveOpenMenuState, 0);
                    return;
                }
                saveOpenMenuState();
            });
        });
    };

    const redirectStaffAwayFromUsersPage = (account) => {
        const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
        if (account.role === 'staff' && path.endsWith('/frontend/views/users.html')) {
            window.location.replace('../index.html');
        }
    };

    window.applyKidCityAuth = function applyKidCityAuth() {
        const account = getCurrentAccount();
        updateHeaderProfile(account);
        if (account.role === 'staff') removeUserManagementMenu();
        bindMenuStatePersistence();
        redirectStaffAwayFromUsersPage(account);
    };

    document.addEventListener('DOMContentLoaded', window.applyKidCityAuth);
})();