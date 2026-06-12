(function () {
    const parseCurrentUser = () => {
        const raw = localStorage.getItem('currentUser');
        if (!raw) return {};

        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed;
        } catch {
            // currentUser dang la username thuong, khong phai JSON.
        }

        return { username: raw };
    };

    const normalizeRole = (value) => {
        const rawRole = String(value || '').trim().toLowerCase();
        const role = rawRole.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split('\u0111').join('d');

        if (['staff', 'nhanvien', 'nhan vien', 'employee'].includes(role)) return 'staff';
        if (['admin', 'owner', 'chushop', 'chu shop', 'shop-owner'].includes(role)) return 'admin';
        return '';
    };

    const getCurrentAccount = () => {
        const user = parseCurrentUser();
        const username = user.username || user.userName || user.account || user.phone || user.soDienThoai || '';
        const savedRole = normalizeRole(localStorage.getItem('currentRole'));
        const objectRole = normalizeRole(user.role || user.vaiTro || user.permission || user.type);
        const labelRole = normalizeRole(user.roleLabel || user.role_label || user.tenVaiTro || user.roleName || user.role_name);
        const role = objectRole || labelRole || savedRole || 'staff';

        return {
            username,
            role,
            roleLabel: user.roleLabel || user.tenVaiTro || (role === 'staff' ? 'Nh?n vi?n' : 'Ch? shop'),
            name: user.fullname || user.fullName || user.name || username,
            email: user.email || '',
            is_first_login: user.is_first_login || false
        };
    };

    const frontendBasePath = () => {
        const path = window.location.pathname.replace(/\\/g, '/');
        const frontendIndex = path.indexOf('/frontend/');
        return frontendIndex >= 0 ? `${path.slice(0, frontendIndex)}/frontend/` : './';
    };

    const loginPathForCurrentPage = () => `${frontendBasePath()}login.html`;
    const indexPathForCurrentPage = () => `${frontendBasePath()}index.html`;

    const ensureAuthenticated = () => {
        if (localStorage.getItem('authToken')) return true;
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentRole');
        window.location.replace(loginPathForCurrentPage());
        return false;
    };

    const removeUserManagementMenu = () => {
        document.querySelectorAll('.menu a[href], .sidebar a[href]').forEach((link) => {
            const href = (link.getAttribute('href') || '').replace(/\\/g, '/').toLowerCase();
            const label = (link.textContent || '').trim().toLowerCase();
            const asciiLabel = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split('\u0111').join('d');
            const isUsersLink = href.endsWith('users.html') || asciiLabel.includes('quan ly nguoi dung');
            if (!isUsersLink) return;

            const item = link.closest('.menu-item') || link.closest('li') || link;
            item.remove();
        });
    };


    const usersHrefForCurrentPage = () => {
        const path = window.location.pathname.replace(/\\/g, '/');
        if (path.endsWith('/frontend/index.html') || path.endsWith('/frontend/')) return 'views/users.html';
        if (path.includes('/frontend/views/products/') || path.includes('/frontend/views/reports/')) return '../users.html';
        if (path.includes('/frontend/views/')) return 'users.html';
        return 'views/users.html';
    };

    const ensureUserManagementMenu = () => {
        const menu = document.querySelector('.sidebar .menu');
        if (!menu) return;

        const hasUsersMenu = Array.from(menu.querySelectorAll('a[href]')).some((link) => {
            const href = (link.getAttribute('href') || '').replace(/\\/g, '/').toLowerCase();
            return href.endsWith('users.html');
        });
        if (hasUsersMenu) return;

        const item = document.createElement('li');
        item.className = 'menu-item';
        item.innerHTML = `<a href="${usersHrefForCurrentPage()}"><i class='bx bx-user'></i> Qu&#7843;n l&#253; ng&#432;&#7901;i d&#249;ng</a>`;

        const firstItem = menu.querySelector('.menu-item');
        if (firstItem?.nextSibling) {
            menu.insertBefore(item, firstItem.nextSibling);
        } else {
            menu.appendChild(item);
        }
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
            window.location.replace(indexPathForCurrentPage());
        }
    };

    const clearAuthStorage = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentRole');
        localStorage.removeItem('authToken');
    };

    const accountMenuHtml = () => `
        <div class="dropdown-menu account-menu">
            <ul class="dropdown-list">
                <li id="open-profile">
                    <i class='bx bx-user'></i> <span>Th&#244;ng tin c&#225; nh&#226;n</span>
                </li>
                <li id="open-password">
                    <i class='bx bx-lock-alt'></i> <span>&#272;&#7893;i m&#7853;t kh&#7849;u</span>
                </li>
                <li class="divider"></li>
                <li class="logout-item">
                    <i class='bx bx-log-out-circle'></i> <span>&#272;&#259;ng xu&#7845;t</span>
                </li>
            </ul>
        </div>
    `;

    const ensureAccountDropdowns = () => {
        document.querySelectorAll('.header-user').forEach((headerUser) => {
            let dropdown = headerUser.closest('.dropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.className = 'dropdown';
                headerUser.parentNode.insertBefore(dropdown, headerUser);
                dropdown.appendChild(headerUser);
            }

            if (!dropdown.querySelector('.account-menu')) {
                dropdown.insertAdjacentHTML('beforeend', accountMenuHtml());
            }
        });
    };

    const bindAccountDropdowns = () => {
        ensureAccountDropdowns();

        const closeAllDropdowns = () => {
            document.querySelectorAll('.dropdown-menu').forEach((menu) => menu.classList.remove('show'));
        };

        document.querySelectorAll('.dropdown').forEach((dropdown) => {
            if (dropdown.dataset.kidCityDropdownBound === 'true') return;
            dropdown.dataset.kidCityDropdownBound = 'true';
            dropdown.addEventListener('click', (event) => {
                const menu = dropdown.querySelector('.dropdown-menu');
                if (!menu) return;
                event.stopPropagation();
                const isShowing = menu.classList.contains('show');
                closeAllDropdowns();
                if (!isShowing) menu.classList.add('show');
            });
        });

        if (document.body.dataset.kidCityDropdownCloseBound !== 'true') {
            document.body.dataset.kidCityDropdownCloseBound = 'true';
            window.addEventListener('click', closeAllDropdowns);
        }
    };

    const bindLogout = () => {
        document.querySelectorAll('.logout-item').forEach((button) => {
            if (button.dataset.kidCityLogoutBound === 'true') return;
            button.dataset.kidCityLogoutBound = 'true';
            button.addEventListener('click', async () => {
                if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
                try {
                    if (window.kidCityApi && localStorage.getItem('authToken')) {
                        await window.kidCityApi.post('auth/logout.php', {});
                    }
                } catch {
                    // Local logout still has to proceed when the token is already expired.
                }
                clearAuthStorage();
                window.location.href = loginPathForCurrentPage();
            });
        });
    };

    const bindProfileModals = () => {
        const closeMenus = () => {
            document.querySelectorAll('.dropdown-menu').forEach((menu) => menu.classList.remove('show'));
        };
        const profileModal = document.getElementById('modal-profile');
        const passwordModal = document.getElementById('modal-password');

        document.querySelectorAll('#open-profile').forEach((button) => {
            if (button.dataset.kidCityProfileBound === 'true') return;
            button.dataset.kidCityProfileBound = 'true';
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                closeMenus();
                profileModal?.classList.add('active');
            });
        });

        document.querySelectorAll('#open-password').forEach((button) => {
            if (button.dataset.kidCityPasswordBound === 'true') return;
            button.dataset.kidCityPasswordBound = 'true';
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                closeMenus();
                passwordModal?.classList.add('active');
            });
        });
    };

    window.applyKidCityAuth = function applyKidCityAuth() {
        if (!ensureAuthenticated()) return;
        const account = getCurrentAccount();
        updateHeaderProfile(account);
        window.resetKidCitySearchInputs();
        const visibleRoleLabel = document.querySelector('.header-user .user-info p')?.textContent || '';
        const isStaffAccount = account.role === 'staff' || normalizeRole(account.roleLabel) === 'staff' || normalizeRole(visibleRoleLabel) === 'staff';
        if (isStaffAccount) {
            removeUserManagementMenu();
        } else {
            ensureUserManagementMenu();
        }
        syncActiveMenu();
        bindMenuToggle();
        bindMenuStatePersistence();
        bindAccountDropdowns();
        bindProfileModals();
        bindLogout();
        if (isStaffAccount) {
            redirectStaffAwayFromUsersPage({ ...account, role: 'staff' });
        } else {
            redirectStaffAwayFromUsersPage(account);
        }
        
        if (account.is_first_login) {
            const passwordModal = document.getElementById('modal-password');
            if (passwordModal) {
                passwordModal.classList.add('active');
                passwordModal.style.pointerEvents = 'none';
                
                const modalContent = passwordModal.querySelector('.modal-content');
                if (modalContent) {
                    modalContent.style.pointerEvents = 'auto';
                }
                
                const closeBtns = passwordModal.querySelectorAll('.close-modal');
                closeBtns.forEach(btn => {
                    btn.style.display = 'none';
                });
                
                const headerText = passwordModal.querySelector('.modal-header h3');
                if (headerText) {
                    headerText.textContent = 'Đổi mật khẩu (Bắt buộc)';
                }
            }
        }
    };

    window.getKidCityLoginPath = loginPathForCurrentPage;
    document.addEventListener('DOMContentLoaded', window.applyKidCityAuth);
    window.addEventListener('pageshow', () => {
        window.applyKidCityAuth();
        window.resetKidCitySearchInputs();
        setTimeout(() => window.resetKidCitySearchInputs(), 50);
    });
})();

