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

window.showToast = function(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            transition: opacity 0.3s, transform 0.3s;
            transform: translateY(-20px);
            opacity: 0;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class='bx bx-check-circle' style='font-size: 1.2rem;'></i> ${escapeHtml(message)}`;
    toast.style.display = 'flex';
    
    // Trigger reflow
    void toast.offsetWidth;
    
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            if (toast.style.opacity === '0') toast.style.display = 'none';
        }, 300);
    }, 3000);
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
});

const bindImagePreview = (inputId, previewId) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    if (!input || !preview) return;
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Dung lượng ảnh vượt quá 5MB.');
                input.value = '';
                preview.style.display = 'none';
                return;
            }
            fileToBase64(file).then(base64 => {
                input.dataset.base64 = base64;
                preview.style.display = 'block';
                preview.querySelector('img').src = base64;
            });
        } else {
            input.dataset.base64 = '';
            preview.style.display = 'none';
        }
    });
};

// Đóng modal khi click ra vùng đen bên ngoài
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-overlay') || event.target.classList.contains('sales-modal')) {
        event.target.classList.remove('active');
    }
});

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

const statusBadgeHtml = (status) => `
    <span class="role-badge ${statusClass(status)}">${escapeHtml(status)}</span>
`;

const userRowHtml = (account) => {
    const avatar = (account.name || 'N').trim().charAt(0).toUpperCase() || 'N';
    const role = account.roleLabel || account.role || 'Nhân viên';
    const status = account.status || 'Chưa kích hoạt';

    return `
        <tr class="${status === 'Khóa' ? 'locked-row' : ''}" data-id="${escapeHtml(account.id)}" data-name="${escapeHtml(account.name)}" data-username="${escapeHtml(account.username)}" data-email="${escapeHtml(account.email)}" data-phone="${escapeHtml(account.phone || account.username)}" data-cccd_image="${escapeHtml(account.cccd_image || account.cccd || '')}" data-role="${escapeHtml(role)}" data-status="${escapeHtml(status)}" data-created="${escapeHtml(account.created)}" data-initial_password="${escapeHtml(account.initial_password || '')}">
            <td>
                <div class="user-info">
                    <div class="avatar bg-light">${escapeHtml(avatar)}</div>
                    <span class="fw-bold">${escapeHtml(account.name)}</span>
                </div>
            </td>
            <td>${escapeHtml(account.username)}</td>
            <td><span class="role-badge ${roleClass(role)}">${escapeHtml(role)}</span></td>
            <td>${statusBadgeHtml(status)}</td>
            <td class="actions">
                <button class="action-btn view" onclick="openUserDetail(this)" title="Xem chi tiết"><i class='bx bx-show'></i></button>
                <button class="action-btn edit" onclick="openUserEdit(this)" title="Chỉnh sửa"><i class='bx bx-pencil'></i></button>
                ${role === 'Chủ shop' || role === 'admin' ? '' : `<button class="action-btn ${status === 'Khóa' ? 'view' : 'delete'}" onclick="toggleUserLock(this)" title="${status === 'Khóa' ? 'Mở khóa' : 'Khóa'}"><i class='bx ${status === 'Khóa' ? 'bx-lock-open-alt' : 'bx-lock-alt'}'></i></button>`}
            </td>
        </tr>
    `;
};

const updateUserCount = () => {
    const total = document.querySelectorAll('.users-table tbody tr').length;
    const info = document.querySelector('.pagination-info p');
    if (info) info.textContent = `Hiển thị ${total} / ${total} người dùng`;
};

const roleWeight = (role) => (role === 'admin' || role === 'Chủ shop' ? 1 : 2);
const statusWeight = (status) => {
    if (status === 'Đã kích hoạt') return 1;
    if (status === 'Chưa kích hoạt') return 2;
    if (status === 'Khóa') return 3;
    return 4;
};

const loadUsersFromApi = async () => {
    if (!window.kidCityApi) return false;
    const tbody = document.querySelector('.users-table tbody');
    if (!tbody) return false;

    try {
        const users = await window.kidCityApi.get('users/index.php');
        users.sort((a, b) => {
            const rA = roleWeight(a.role || a.roleLabel);
            const rB = roleWeight(b.role || b.roleLabel);
            if (rA !== rB) return rA - rB;
            const sA = statusWeight(a.status || 'Chưa kích hoạt');
            const sB = statusWeight(b.status || 'Chưa kích hoạt');
            if (sA !== sB) return sA - sB;
            return 0;
        });
        tbody.innerHTML = users.map(userRowHtml).join('');
        updateUserCount();
        return true;
    } catch (error) {
        console.warn('Khong the tai danh sach nguoi dung tu API:', error.message);
        return false;
    }
};

window.generateRandomPassword = function() {
    const field = document.getElementById('addPassword');
    if (field) {
        field.value = Math.random().toString(36).slice(-8);
    }
};

const resetAddUserForm = () => {
    ['addName', 'addRole', 'addUsername', 'addEmail', 'addPhone', 'addCccdImage'].forEach((id) => {
        const field = document.getElementById(id);
        if (!field) return;
        field.value = id === 'addRole' ? 'Nhân viên' : '';
        if (id === 'addCccdImage') field.dataset.base64 = '';
    });
    window.generateRandomPassword();
    const preview = document.getElementById('addCccdPreview');
    if (preview) preview.style.display = 'none';
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
        cccd_image: document.getElementById('addCccdImage')?.dataset.base64 || '',
        status: 'Chưa kích hoạt',
        created: formatToday()
    };
    account.role = roleCode(account.roleLabel);

    if (!account.name || !account.username || !account.password || !account.email || !account.phone || !account.cccd_image) {
        alert('Vui lòng nhập đầy đủ tất cả các thông tin (bao gồm cả ảnh CCCD).');
        return;
    }
    
    if (account.phone.length !== 10) {
        alert('Số điện thoại phải bao gồm đúng 10 chữ số.');
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
            account.initial_password = account.password;
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
        updateUserCount();
    }

    resetAddUserForm();
    closeModal('addUserModal');
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
    setText('detailRole', data.role);
    setText('detailStatus', data.status);
    setText('detailCreated', data.created);
    
    const initialPasswordContainer = document.getElementById('detailInitialPasswordContainer');
    if (initialPasswordContainer) {
        if (data.initial_password) {
            setText('detailInitialPassword', data.initial_password);
            initialPasswordContainer.style.display = 'block';
        } else {
            initialPasswordContainer.style.display = 'none';
        }
    }
    
    const imgEl = document.getElementById('detailCccdImage');
    const txtEl = document.getElementById('detailCccdText');
    if (imgEl && txtEl) {
        if (data.cccd_image && data.cccd_image !== 'undefined') {
            let imgSrc = data.cccd_image;
            if (imgSrc.startsWith('backend/')) {
                imgSrc = `../../${imgSrc}`;
            } else if (!imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
                imgSrc = `../../backend/uploads/cccd/${imgSrc}`;
            }
            imgEl.src = imgSrc;
            imgEl.style.display = 'block';
            txtEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            txtEl.style.display = 'block';
        }
    }

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
    setValue('editCreated', data.created);
    
    const input = document.getElementById('editCccdImage');
    const preview = document.getElementById('editCccdPreview');
    if (input) {
        input.value = '';
        input.dataset.base64 = '';
        if (data.cccd_image && data.cccd_image !== 'undefined') {
            input.removeAttribute('required');
        } else {
            input.setAttribute('required', 'required');
        }
    }
    if (preview) {
        if (data.cccd_image && data.cccd_image !== 'undefined') {
            preview.style.display = 'block';
            let imgSrc = data.cccd_image;
            if (imgSrc.startsWith('backend/')) {
                imgSrc = `../../${imgSrc}`;
            } else if (!imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
                imgSrc = `../../backend/uploads/cccd/${imgSrc}`;
            }
            preview.querySelector('img').src = imgSrc;
        } else {
            preview.style.display = 'none';
        }
    }

    openModal('editUserModal');
    document.getElementById('editUserModal').dataset.editId = data.id;
    document.getElementById('editUserModal').dataset.editRowIndex = row.rowIndex;
};

window.editUserFromModal = async function() {
    const modal = document.getElementById('editUserModal');
    const id = modal.dataset.editId;
    if (!id) return;

    const account = {
        id: id,
        name: document.getElementById('editName')?.value.trim() || '',
        roleLabel: document.getElementById('editRole')?.value || 'Nhân viên',
        email: document.getElementById('editEmail')?.value.trim() || '',
        phone: document.getElementById('editPhone')?.value.trim() || '',
        cccd_image: document.getElementById('editCccdImage')?.dataset.base64 || ''
    };
    account.role = roleCode(account.roleLabel);

    if (!account.name || !account.email || !account.phone) {
        alert('Vui lòng nhập đầy đủ họ tên, email và số điện thoại.');
        return;
    }

    if (account.phone.length !== 10) {
        alert('Số điện thoại phải bao gồm đúng 10 chữ số.');
        return;
    }

    try {
        if (window.kidCityApi) {
            const updated = await window.kidCityApi.put('users/index.php', account);
            account.cccd_image = updated.cccd_image || updated.cccd || '';
        } else {
            throw new Error('Không thể kết nối API người dùng.');
        }
    } catch (error) {
        alert(error.message || 'Không thể cập nhật người dùng.');
        return;
    }

    const row = document.querySelector(`.users-table tbody tr[data-id="${id}"]`);
    if (row) {
        row.dataset.name = account.name;
        row.dataset.email = account.email;
        row.dataset.phone = account.phone;
        row.dataset.role = account.roleLabel;
        if (account.cccd_image) row.dataset.cccd_image = account.cccd_image;
        
        row.querySelector('.user-info span.fw-bold').textContent = account.name;
        row.querySelector('.user-info .avatar').textContent = account.name.charAt(0).toUpperCase();
        row.querySelector('td:nth-child(3)').innerHTML = `<span class="role-badge ${roleClass(account.roleLabel)}">${escapeHtml(account.roleLabel)}</span>`;
    }

    closeModal('editUserModal');
    showToast('Cập nhật thành công!');
};

window.toggleUserLock = async function(button) {
    const row = button.closest('tr');
    if (!row) return;

    const currentStatus = row.dataset.status;
    const isLocked = currentStatus === 'Khóa';
    const newStatus = isLocked ? 'Đã kích hoạt' : 'Khóa';
    const name = row.dataset.name || 'người dùng này';

    const modal = document.getElementById('toggleLockUserModal');
    const icon = document.getElementById('toggleLockIcon');
    const title = document.getElementById('toggleLockTitle');
    const message = document.getElementById('toggleLockMessage');
    const confirmBtn = document.getElementById('confirmToggleLockBtn');

    if (!modal || !confirmBtn) return;

    if (isLocked) {
        icon.className = "bx bx-lock-open-alt";
        icon.style.color = "#10b981";
        title.textContent = "Xác nhận mở khóa";
        message.innerHTML = `Bạn có chắc chắn muốn mở khóa tài khoản <strong>${name}</strong>?`;
    } else {
        icon.className = "bx bx-lock-alt";
        icon.style.color = "#f59e0b";
        title.textContent = "Xác nhận khóa";
        message.innerHTML = `Bạn có chắc chắn muốn khóa tài khoản <strong>${name}</strong>?`;
    }

    confirmBtn.onclick = async function() {
        closeModal('toggleLockUserModal');

        if (window.kidCityApi && row.dataset.id) {
            try {
                await window.kidCityApi.put('users/index.php', {
                    id: row.dataset.id,
                    status: newStatus
                });
            } catch (error) {
                alert(error.message || 'Không thể cập nhật trạng thái tài khoản.');
                return;
            }
        }

        row.dataset.status = newStatus;
        if (newStatus === 'Khóa') {
            row.classList.add('locked-row');
        } else {
            row.classList.remove('locked-row');
        }
        
        row.querySelector('td:nth-child(4)').innerHTML = statusBadgeHtml(newStatus);
        
        const actionBtn = row.querySelector('.actions button.delete') || row.querySelector('.actions button.view:last-child');
        if (actionBtn) {
            actionBtn.className = `action-btn ${newStatus === 'Khóa' ? 'view' : 'delete'}`;
            actionBtn.title = newStatus === 'Khóa' ? 'Mở khóa' : 'Khóa';
            actionBtn.innerHTML = `<i class='bx ${newStatus === 'Khóa' ? 'bx-lock-open-alt' : 'bx-lock-alt'}'></i>`;
        }

        showToast(`${isLocked ? 'Mở khóa' : 'Khóa'} tài khoản thành công!`);
    };

    openModal('toggleLockUserModal');
};

const statusClass = (status) => {
    if (status === 'Đã kích hoạt') return 'active';
    if (status === 'Chưa kích hoạt') return 'inactive';
    return 'locked';
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
    bindImagePreview('addCccdImage', 'addCccdPreview');
    bindImagePreview('editCccdImage', 'editCccdPreview');
    bindUserSearch();

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
        if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('sales-modal')) {
            e.target.classList.remove('active');
            if (profileModal) profileModal.classList.remove('active');
            if (passwordModal) passwordModal.classList.remove('active');
        }
    });
});
