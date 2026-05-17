(function () {
    const closeAllDropdowns = () => {
        document.querySelectorAll('.dropdown-menu').forEach((menu) => menu.classList.remove('show'));
    };

    const bindHeader = () => {
        document.querySelectorAll('.menu-toggle').forEach((toggle) => {
            toggle.addEventListener('click', (event) => {
                event.preventDefault();
                toggle.closest('.menu-item')?.classList.toggle('open');
            });
        });

        const userDrop = document.getElementById('user-dropdown');
        const notiDrop = document.getElementById('notification-dropdown');

        [userDrop, notiDrop].forEach((drop) => {
            if (!drop) return;
            drop.addEventListener('click', (event) => {
                event.stopPropagation();
                const menu = drop.querySelector('.dropdown-menu');
                const isShowing = menu?.classList.contains('show');
                closeAllDropdowns();
                if (menu && !isShowing) menu.classList.add('show');
                const dot = drop.querySelector('.badge-dot');
                if (dot && drop === notiDrop) dot.style.display = 'none';
            });
        });

        const profileModal = document.getElementById('modal-profile');
        const passwordModal = document.getElementById('modal-password');
        document.getElementById('open-profile')?.addEventListener('click', () => profileModal?.classList.add('active'));
        document.getElementById('open-password')?.addEventListener('click', () => passwordModal?.classList.add('active'));
        document.querySelectorAll('.close-modal').forEach((btn) => {
            btn.addEventListener('click', () => {
                profileModal?.classList.remove('active');
                passwordModal?.classList.remove('active');
            });
        });
        document.querySelector('.logout-item')?.addEventListener('click', () => {
            if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentRole');
            window.location.href = '../../login.html';
        });
        window.addEventListener('click', (event) => {
            closeAllDropdowns();
            if (event.target.classList.contains('modal-overlay')) event.target.classList.remove('active');
        });
    };

    const bindReportFilters = () => {
        const page = document.querySelector('.reports-page');
        if (!page) return;
        const search = page.querySelector('[data-report-search]');
        const filter = page.querySelector('[data-report-filter]');
        const rows = Array.from(page.querySelectorAll('[data-report-table] tr'));

        const render = () => {
            const keyword = (search?.value || '').trim().toLowerCase();
            const selected = filter?.value || 'all';
            let visible = 0;
            rows.forEach((row) => {
                const text = row.textContent.toLowerCase();
                const tags = row.dataset.tags || 'all';
                const matchKeyword = !keyword || text.includes(keyword);
                const matchFilter = selected === 'all' || tags.includes(selected);
                const show = matchKeyword && matchFilter;
                row.style.display = show ? '' : 'none';
                if (show) visible += 1;
            });

            let empty = page.querySelector('.report-empty');
            const table = page.querySelector('[data-report-table]');
            if (!empty && table) {
                empty = document.createElement('tr');
                empty.className = 'report-empty';
                empty.innerHTML = `<td colspan="8">Không có dữ liệu phù hợp.</td>`;
                table.appendChild(empty);
            }
            if (empty) empty.style.display = visible ? 'none' : '';
        };

        search?.addEventListener('input', render);
        filter?.addEventListener('change', render);
        render();
    };

    const bindExport = () => {
        document.querySelectorAll('[data-export-report]').forEach((btn) => {
            btn.addEventListener('click', () => alert('Đã tạo dữ liệu báo cáo mẫu. Có thể nối chức năng xuất Excel sau.'));
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        bindHeader();
        bindReportFilters();
        bindExport();
    });
})();