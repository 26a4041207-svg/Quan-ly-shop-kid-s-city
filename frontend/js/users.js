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

const USER_ACCOUNTS_KEY = 'kidCityAccounts';

const getStoredUserAccounts = () => {
    try {
        return JSON.parse(localStorage.getItem(USER_ACCOUNTS_KEY) || '{}');
    } catch {
        return {};
    }
};

const saveStoredUserAccounts = (accounts) => {
    localStorage.setItem(USER_ACCOUNTS_KEY, JSON.stringify(accounts));
};

const roleCode = (role) => role === 'Chủ shop' ? 'admin' : 'staff';

const roleClass = (role) => role === 'Chủ shop' ? 'shop-owner' : 'staff';

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
}[char]));

const formatToday = () => {
    const today = new Date();
    return `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
};

const statusSelectHtml = (status) => `
    <select class="status-select ${statusClass(status)}" data-user-status>
        <option ${status === 'Đã kích hoạt' ? 'selected' : ''}>Đã kích hoạt</option>
        <option ${status === 'Chưa kích hoạt' ? 'selected' : ''}>Chưa kích hoạt</option>
        <option ${status === 'Khóa' ? 'selected' : ''}>Khóa</option>
    </select>
`;

const userRowHtml = (account) => {
    const avatar = (account.name || 'N').trim().charAt(0).toUpperCase() || 'N';
    const role = account.roleLabel || account.role || 'Nhân viên';
    const status = account.status || 'Chưa kích hoạt';

    return `
        <tr data-id="${escapeHtml(account.id)}" data-name="${escapeHtml(account.name)}" data-username="${escapeHtml(account.username)}" data-email="${escapeHtml(account.email)}" data-phone="${escapeHtml(account.phone || account.username)}" data-cccd="${escapeHtml(account.cccd)}" data-address="${escapeHtml(account.address)}" data-role="${escapeHtml(role)}" data-status="${escapeHtml(status)}" data-created="${escapeHtml(account.created)}">
            <td>
                <div class="user-info">
                    <div class="avatar bg-light">${escapeHtml(avatar)}</div>
                    <span class="fw-bold">${escapeHtml(account.name)}</span>
                </div>
            </td>
            <td>${escapeHtml(account.username)}</td>
            <td><span class="role-badge ${roleClass(role)}">${escapeHtml(role)}</span></td>
            <td>${statusSelectHtml(status)}</td>
            <td class="actions">
                <button class="icon-btn" onclick="openUserDetail(this)" title="Xem chi tiết"><i class='bx bx-show'></i></button>
                <button class="icon-btn" onclick="openUserEdit(this)" title="Chỉnh sửa"><i class='bx bx-pencil'></i></button>
                <button class="icon-btn" onclick="openModal('resetPasswordModal')" title="Đổi mật khẩu"><i class='bx bx-key'></i></button>
            </td>
        </tr>
    `;
};

const updateUserCount = () => {
    const total = document.querySelectorAll('.users-table tbody tr').length;
    const info = document.querySelector('.pagination-info p');
    if (info) info.textContent = `Hiển thị ${total} / ${total} người dùng`;
};

const updateStoredAccountFromRow = (row) => {
    if (!row?.dataset.username) return;
    const accounts = getStoredUserAccounts();
    const username = row.dataset.username;
    accounts[username] = {
        ...(accounts[username] || {}),
        username,
        name: row.dataset.name || username,
        email: row.dataset.email || '',
        phone: row.dataset.phone || username,
        cccd: row.dataset.cccd || '',
        address: row.dataset.address || '',
        role: roleCode(row.dataset.role),
        roleLabel: row.dataset.role || 'Nhân viên',
        status: row.dataset.status || 'Chưa kích hoạt',
        created: row.dataset.created || formatToday()
    };
    saveStoredUserAccounts(accounts);
};

const loadStoredUsersIntoTable = () => {
    const tbody = document.querySelector('.users-table tbody');
    if (!tbody) return;

    const existingUsernames = new Set(Array.from(tbody.querySelectorAll('tr')).map((row) => row.dataset.username));
    const rows = Object.values(getStoredUserAccounts())
        .filter((account) => account?.username && !existingUsernames.has(account.username))
        .map(userRowHtml)
        .join('');

    if (rows) {
        tbody.insertAdjacentHTML('beforeend', rows);
    }

    updateUserCount();
};

const loadUsersFromApi = async () => {
    if (!window.kidCityApi) return false;
    const tbody = document.querySelector('.users-table tbody');
    if (!tbody) return false;

    try {
        const users = await window.kidCityApi.get('users/index.php');
        tbody.innerHTML = users.map(userRowHtml).join('');
        bindUserStatusSelects();
        updateUserCount();
        return true;
    } catch (error) {
        console.warn('Khong the tai danh sach nguoi dung tu API:', error.message);
        return false;
    }
};

const resetAddUserForm = () => {
    ['addName', 'addRole', 'addUsername', 'addPassword', 'addEmail', 'addPhone', 'addCccd', 'addAddress'].forEach((id) => {
        const field = document.getElementById(id);
        if (!field) return;
        field.value = id === 'addRole' ? 'Nhân viên' : '';
    });
};

const bindAddUserPhoneSync = () => {
    const phone = document.getElementById('addPhone');
    const username = document.getElementById('addUsername');
    if (!phone || !username || phone.dataset.usernameBound === 'true') return;

    phone.dataset.usernameBound = 'true';
    phone.addEventListener('input', () => {
        username.value = phone.value.trim();
    });
};

window.createUserFromModal = async function createUserFromModal() {
    const account = {
        name: document.getElementById('addName')?.value.trim() || '',
        roleLabel: document.getElementById('addRole')?.value || 'Nhân viên',
        username: document.getElementById('addUsername')?.value.trim() || document.getElementById('addPhone')?.value.trim() || '',
        password: document.getElementById('addPassword')?.value || '',
        email: document.getElementById('addEmail')?.value.trim() || '',
        phone: document.getElementById('addPhone')?.value.trim() || '',
        cccd: document.getElementById('addCccd')?.value.trim() || '',
        address: document.getElementById('addAddress')?.value.trim() || '',
        status: 'Chưa kích hoạt',
        created: formatToday()
    };
    account.role = roleCode(account.roleLabel);

    if (!account.name || !account.username || !account.password) {
        alert('Vui lòng nhập đầy đủ họ tên, số điện thoại và mật khẩu.');
        return;
    }

    const existsInTable = document.querySelector(`.users-table tbody tr[data-username="${CSS.escape(account.username)}"]`);
    if (existsInTable) {
        alert('Số điện thoại này đã tồn tại trong hệ thống.');
        return;
    }

    try {
        if (window.kidCityApi) {
            const created = await window.kidCityApi.post('users/index.php', account);
            account.id = created.id;
        } else {
            throw new Error('Không thể kết nối API người dùng.');
        }
    } catch (error) {
        alert(error.message || 'Không thể thêm người dùng.');
        return;
    }

    const tbody = document.querySelector('.users-table tbody');
    if (tbody) {
        tbody.insertAdjacentHTML('beforeend', userRowHtml(account));
        bindUserStatusSelects();
        updateUserCount();
    }

    resetAddUserForm();
    closeModal('addUserModal');
    showToast('Thêm người dùng thành công!');
};

window.openUserDetail = function(button) {
    const row = button.closest('tr');
    if (!row) return;

    const data = row.dataset;
    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value || '-';
    };

    setText('detailAvatar', (data.name || 'N').trim().charAt(0).toUpperCase());
    setText('detailName', data.name);
    setText('detailEmail', data.email);
    setText('detailFullName', data.name);
    setText('detailUsername', data.username);
    setText('detailUserEmail', data.email);
    setText('detailPhone', data.phone);
    setText('detailCccd', data.cccd);
    setText('detailAddress', data.address);
    setText('detailRole', data.role);
    setText('detailStatus', data.status);
    setText('detailCreated', data.created);

    openModal('viewUserModal');
};

window.openUserEdit = function(button) {
    const row = button.closest('tr');
    if (!row) return;

    const data = row.dataset;
    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = value || '';
        }
    };

    setValue('editName', data.name);
    setValue('editRole', data.role);
    setValue('editUsername', data.username);
    setValue('editEmail', data.email);
    setValue('editPhone', data.phone);
    setValue('editCccd', data.cccd);
    setValue('editAddress', data.address);
    setValue('editCreated', data.created);

    openModal('editUserModal');
};

const statusClass = (status) => {
    if (status === 'Đã kích hoạt') return 'active';
    if (status === 'Chưa kích hoạt') return 'inactive';
    return 'locked';
};

const bindUserStatusSelects = () => {
    document.querySelectorAll('[data-user-status]').forEach((select) => {
        if (select.dataset.statusBound === 'true') return;
        select.dataset.statusBound = 'true';
        select.dataset.previousStatus = select.value;
        select.classList.add(statusClass(select.value));

        select.addEventListener('change', () => {
            const row = select.closest('tr');
            const oldStatus = select.dataset.previousStatus || row?.dataset.status || '';
            const newStatus = select.value;
            const name = row?.dataset.name || 'người dùng này';

            if (!confirm(`Bạn có chắc chắn muốn đổi trạng thái tài khoản ${name} từ "${oldStatus}" sang "${newStatus}" không?`)) {
                select.value = oldStatus;
                select.className = `status-select ${statusClass(oldStatus)}`;
                return;
            }

            if (row) {
                row.dataset.status = newStatus;
                updateStoredAccountFromRow(row);
                if (window.kidCityApi && row.dataset.id) {
                    window.kidCityApi.put('users/index.php', {
                        id: row.dataset.id,
                        name: row.dataset.name,
                        username: row.dataset.username,
                        email: row.dataset.email,
                        phone: row.dataset.phone,
                        cccd: row.dataset.cccd,
                        address: row.dataset.address,
                        role: roleCode(row.dataset.role),
                        status: newStatus
                    }).catch((error) => {
                        alert(error.message || 'Không thể cập nhật trạng thái tài khoản.');
                    });
                }
            }
            select.dataset.previousStatus = newStatus;
            select.className = `status-select ${statusClass(newStatus)}`;
            showToast('Cập nhật trạng thái thành công!');
        });
    });
};

const normalizeSearchText = (text) => String(text || '').trim().toLowerCase();

const bindUserSearch = () => {
    const input = document.getElementById('userSearch');
    if (!input) return;

    input.addEventListener('input', () => {
        const keyword = normalizeSearchText(input.value);
        const rows = Array.from(document.querySelectorAll('.users-table tbody tr'));
        rows.forEach((row) => {
            const dataText = Object.values(row.dataset).join(' ');
            const searchable = normalizeSearchText(`${row.textContent} ${dataText}`);
            row.style.display = searchable.includes(keyword) ? '' : 'none';
        });
    });
};
// ==========================================
// XU LY MENU VA HEADER RIENG CHO TRANG USERS
// users.html la trang day du, khong nap index.js de tranh router ghi de noi dung.
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    loadUsersFromApi().then(function(loaded) {
        if (!loaded) updateUserCount();
    });
    bindAddUserPhoneSync();
    bindUserSearch();
    bindUserStatusSelects();

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

    if (userDrop && userDrop.dataset.kidCityDropdownBound !== 'true') {
        userDrop.dataset.kidCityDropdownBound = 'true';
        userDrop.addEventListener('click', function(e) {
            e.stopPropagation();
            const menu = userDrop.querySelector('.dropdown-menu');
            if (!menu) return;
            const isShowing = menu.classList.contains('show');
            closeAllDropdowns();
            if (!isShowing) menu.classList.add('show');
        });
    }

    if (notiDrop && notiDrop.dataset.kidCityDropdownBound !== 'true') {
        notiDrop.dataset.kidCityDropdownBound = 'true';
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

    if (openProfile && profileModal && openProfile.dataset.kidCityProfileBound !== 'true') {
        openProfile.dataset.kidCityProfileBound = 'true';
        openProfile.addEventListener('click', function() {
            profileModal.classList.add('active');
            closeAllDropdowns();
        });
    }

    if (openPassword && passwordModal && openPassword.dataset.kidCityPasswordBound !== 'true') {
        openPassword.dataset.kidCityPasswordBound = 'true';
        openPassword.addEventListener('click', function() {
            clearPasswordForm();
            passwordModal.classList.add('active');
            closeAllDropdowns();
            setTimeout(clearPasswordForm, 0);
        });
    }

    const clearPasswordForm = function() {
        if (!passwordModal) return;
        passwordModal.querySelectorAll('input[type="password"]').forEach(function(input) {
            input.value = '';
            input.classList.remove('input-error');
        });
        const error = document.getElementById('password-match-error');
        if (error) {
            error.textContent = '';
            error.classList.remove('show');
        }
    };

    const showPasswordError = function(message) {
        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-new-password');
        const error = document.getElementById('password-match-error');

        if (newPasswordInput) newPasswordInput.classList.add('input-error');
        if (confirmPasswordInput) confirmPasswordInput.classList.add('input-error');
        if (error) {
            error.textContent = message;
            error.classList.add('show');
        }
    };

    const clearPasswordError = function() {
        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-new-password');
        const error = document.getElementById('password-match-error');

        if (newPasswordInput) newPasswordInput.classList.remove('input-error');
        if (confirmPasswordInput) confirmPasswordInput.classList.remove('input-error');
        if (error) {
            error.textContent = '';
            error.classList.remove('show');
        }
    };

    ['new-password', 'confirm-new-password'].forEach(function(id) {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', clearPasswordError);
    });

    document.querySelectorAll('.close-modal').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (profileModal) profileModal.classList.remove('active');
            if (passwordModal) passwordModal.classList.remove('active');
            clearPasswordForm();
        });
    });

    const savePasswordBtn = document.getElementById('save-password-change');
    if (savePasswordBtn) {
        savePasswordBtn.addEventListener('click', async function() {
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
                if (passwordModal) passwordModal.classList.remove('active');
                clearPasswordForm();
            } catch (error) {
                showPasswordError(error.message || 'Không thể đổi mật khẩu.');
            }
        });
    }

    const logoutBtn = document.querySelector('.logout-item');
    if (logoutBtn && logoutBtn.dataset.kidCityLogoutBound !== 'true') {
        logoutBtn.dataset.kidCityLogoutBound = 'true';
        logoutBtn.addEventListener('click', function() {
            if (confirm('Ban co chac chan muon dang xuat?')) {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('currentUser');
                localStorage.removeItem('currentRole');
                localStorage.removeItem('authToken');
                window.location.href = window.getKidCityLoginPath ? window.getKidCityLoginPath() : '../login.html';
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
