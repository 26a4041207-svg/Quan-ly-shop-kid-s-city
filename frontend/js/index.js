document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. XỬ LÝ SUB-MENU (MENU CON) ---
    const menuToggles = document.querySelectorAll('.menu-toggle');
    menuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const parentLi = toggle.parentElement;
            parentLi.classList.toggle('open');
        });
    });

    // --- 2. XỬ LÝ NẠP TRANG (SPA ROUTING) ---
    const mainContent = document.getElementById('main-content');
    
    const loadPage = async (pageUrl) => {
        try {
            const response = await fetch(`views/${pageUrl}.html`);
            if (!response.ok) throw new Error('Không tìm thấy trang');
            const html = await response.text();
            mainContent.innerHTML = html;
        } catch (error) {
            mainContent.innerHTML = `
                <div style="text-align: center; margin-top: 50px;">
                    <h2>Opps! Lỗi tải trang</h2>
                    <p style="color: red;">${error.message}</p>
                    <p><i>Hãy chắc chắn bạn đang chạy code qua Local Server (như Live Server trên VS Code).</i></p>
                </div>`;
        }
    }

    // Load mặc định
    loadPage('dashboard');

    // Sự kiện click chuyển trang trên menu
    const menuLinks = document.querySelectorAll('.menu-item > a[data-target]');
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Xử lý Active state
            const currentActive = document.querySelector('.menu-item.active');
            if (currentActive) currentActive.classList.remove('active');
            link.parentElement.classList.add('active');
            
            // Tải nội dung
            const target = link.getAttribute('data-target');
            if(target) loadPage(target);
        });
    });

    // --- 3. XỬ LÝ RESPONSIVE MOBILE SIDEBAR ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    
    // Tạo lớp phủ tối màu
    const overlay = document.createElement('div');
    overlay.classList.add('sidebar-overlay');
    document.body.appendChild(overlay);

    // Mở menu
    if(mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('show');
            overlay.classList.add('show');
        });
    }

    // Đóng menu khi bấm ra ngoài lớp phủ
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
    });

    // Tự động đóng menu trên mobile khi click vào 1 link
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if(window.innerWidth <= 768) {
                sidebar.classList.remove('show');
                overlay.classList.remove('show');
            }
        });
    });

});