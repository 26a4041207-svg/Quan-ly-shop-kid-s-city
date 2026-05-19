(function () {
    const accounts = {
        '0901234567': { role: 'admin', roleLabel: 'Chủ shop', name: 'Nguyễn Văn An', email: 'admin@kidscity.vn' },
        '0912345678': { role: 'staff', roleLabel: 'Nhân viên', name: 'Trần Thị Bình', email: 'binh@kidscity.vn' },
        '0934567890': { role: 'staff', roleLabel: 'Nhân viên', name: 'Phạm Thị Dung', email: 'dung@kidscity.vn' },
        '0945678901': { role: 'staff', roleLabel: 'Nhân viên', name: 'Hoàng Văn Em', email: 'em@kidscity.vn' }
    };

    const parseCurrentUser = () => {
        const raw = localStorage.getItem('currentUser');
        if (!raw) return { username: '0901234567' };

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
        const username = user.username || user.userName || user.account || user.phone || user.soDienThoai || '0901234567';
        const savedRole = normalizeRole(localStorage.getItem('currentRole'));
        const objectRole = normalizeRole(user.role || user.vaiTro || user.permission || user.type);
        const fallbackRole = String(username) === '0901234567' ? 'admin' : 'staff';
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

    window.resetKidCitySearchInputs = function resetKidCitySearchInputs(scope = document) {
        const root = scope instanceof Element || scope instanceof Document ? scope : document;
        root.querySelectorAll([
            '.search-bar input',
            '.sales-search input[id$="-search"]',
            '.report-search input',
            '#userSearch',
            '#productSearch',
            '#import-search'
        ].join(',')).forEach((input) => {
            input.setAttribute('autocomplete', 'off');
            input.value = '';
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

    const bindMenuToggle = () => {
        document.querySelectorAll('.menu-toggle').forEach((toggle) => {
            if (toggle.dataset.kidCityMenuBound === 'true') return;
            toggle.dataset.kidCityMenuBound = 'true';
            toggle.addEventListener('click', (event) => {
                event.preventDefault();
                const item = toggle.closest('.menu-item');
                if (!item) return;
                item.classList.toggle('open');
                setTimeout(saveOpenMenuState, 0);
            });
        });
    };

    const bindMenuStatePersistence = () => {
        restoreOpenMenuState();
        document.querySelectorAll('.menu a').forEach((link) => {
            if (link.dataset.kidCityStateBound === 'true') return;
            link.dataset.kidCityStateBound = 'true';
            link.addEventListener('click', () => {
                if (link.classList.contains('menu-toggle')) {
                    setTimeout(saveOpenMenuState, 0);
                    return;
                }
                saveOpenMenuState();
            });
        });
    };

    const syncActiveMenu = () => {
        const menu = document.querySelector('.menu');
        if (!menu) return;

        menu.querySelectorAll('.menu-item.active').forEach((item) => item.classList.remove('active'));
        menu.querySelectorAll('.submenu a.active').forEach((item) => item.classList.remove('active'));
        menu.querySelectorAll('.submenu-active').forEach((item) => item.classList.remove('submenu-active'));

        const currentPath = window.location.pathname.replace(/\\/g, '/').toLowerCase();
        const currentHash = window.location.hash.replace(/^#/, '').toLowerCase();
        let activeLink = null;

        if (currentHash) {
            activeLink = menu.querySelector(`[data-target="${currentHash}"]`);
            if (!activeLink) {
                activeLink = Array.from(menu.querySelectorAll('a[href]')).find((link) => {
                    const href = (link.getAttribute('href') || '').replace(/\\/g, '/').toLowerCase();
                    return href.endsWith(`#${currentHash}`);
                });
            }
        }

        if (!activeLink) {
            activeLink = Array.from(menu.querySelectorAll('a[href]:not(.menu-toggle)')).find((link) => {
                const linkPath = new URL(link.getAttribute('href'), window.location.href).pathname
                    .replace(/\\/g, '/')
                    .toLowerCase();
                return linkPath === currentPath;
            });
        }

        if (!activeLink) return;

        const submenu = activeLink.closest('.submenu');
        if (submenu) {
            activeLink.classList.add('active');
            activeLink.closest('li')?.classList.add('submenu-active');
            const parentItem = submenu.closest('.menu-item');
            if (parentItem) parentItem.classList.add('active', 'open');
            return;
        }

        activeLink.closest('.menu-item')?.classList.add('active');
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
        window.resetKidCitySearchInputs();
        if (account.role === 'staff') {
            removeUserManagementMenu();
        }
        syncActiveMenu();
        bindMenuToggle();
        bindMenuStatePersistence();
        redirectStaffAwayFromUsersPage(account);
    };

    document.addEventListener('DOMContentLoaded', window.applyKidCityAuth);
    window.addEventListener('pageshow', () => {
        window.resetKidCitySearchInputs();
        setTimeout(() => window.resetKidCitySearchInputs(), 50);
    });
})();
