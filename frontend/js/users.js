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