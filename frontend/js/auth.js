(function () {
    const accounts = {
        admin: {
            role: 'admin',
            roleLabel: 'Chủ shop',
            name: 'Nguyễn Văn An',
            email: 'admin@kidscity.vn'
        },
        staff1: {
            role: 'staff',
            roleLabel: 'Nhân viên',
            name: 'Trần Thị Bình',
            email: 'binh@kidscity.vn'
        },
        staff3: {
            role: 'staff',
            roleLabel: 'Nhân viên',
            name: 'Phạm Thị Dung',
            email: 'dung@kidscity.vn'
        },
        staff4: {
            role: 'staff',
            roleLabel: 'Nhân viên',
            name: 'Hoàng Văn Em',
            email: 'em@kidscity.vn'
        }
    };

    const getCurrentAccount = () => {
        const username = localStorage.getItem('currentUser') || 'admin';
        const savedRole = localStorage.getItem('currentRole');
        const fallbackRole = username.toLowerCase().startsWith('staff') ? 'staff' : 'admin';
        const account = accounts[username] || {};
        const role = savedRole || account.role || fallbackRole;

        return {
            username,
            role,
            roleLabel: account.roleLabel || (role === 'staff' ? 'Nhân viên' : 'Chủ shop'),
            name: account.name || username,
            email: account.email || `${username}@kidscity.vn`
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
        redirectStaffAwayFromUsersPage(account);
    };

    document.addEventListener('DOMContentLoaded', window.applyKidCityAuth);
})();