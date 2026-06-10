(function () {
    const closeAllDropdowns = () => {
        document.querySelectorAll('.dropdown-menu').forEach((menu) => menu.classList.remove('show'));
    };

    const bindHeader = () => {
        document.querySelectorAll('.menu-toggle').forEach((toggle) => {
            if (toggle.dataset.kidCityMenuBound === 'true') return;
            toggle.dataset.kidCityMenuBound = 'true';
            toggle.addEventListener('click', (event) => {
                event.preventDefault();
                toggle.closest('.menu-item')?.classList.toggle('open');
            });
        });

        const userDrop = document.getElementById('user-dropdown');
        const notiDrop = document.getElementById('notification-dropdown');

        [userDrop, notiDrop].forEach((drop) => {
            if (!drop) return;
            if (drop.dataset.kidCityDropdownBound === 'true') return;
            drop.dataset.kidCityDropdownBound = 'true';
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
        const openProfile = document.getElementById('open-profile');
        if (openProfile && openProfile.dataset.kidCityProfileBound !== 'true') {
            openProfile.dataset.kidCityProfileBound = 'true';
            openProfile.addEventListener('click', () => profileModal?.classList.add('active'));
        }

        const clearPasswordForm = () => {
            if (!passwordModal) return;
            passwordModal.querySelectorAll('input[type="password"]').forEach((input) => {
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
            document.getElementById('new-password')?.classList.add('input-error');
            document.getElementById('confirm-new-password')?.classList.add('input-error');
            const error = document.getElementById('password-match-error');
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

        ['new-password', 'confirm-new-password'].forEach((id) => {
            document.getElementById(id)?.addEventListener('input', clearPasswordError);
        });

        const openPassword = document.getElementById('open-password');
        if (openPassword && openPassword.dataset.kidCityPasswordBound !== 'true') {
            openPassword.dataset.kidCityPasswordBound = 'true';
            openPassword.addEventListener('click', () => {
                clearPasswordForm();
                passwordModal?.classList.add('active');
                setTimeout(clearPasswordForm, 0);
            });
        }

        const savePasswordBtn = document.getElementById('save-password-change');
        if (savePasswordBtn && savePasswordBtn.dataset.kidCityPasswordSaveBound !== 'true') {
            savePasswordBtn.dataset.kidCityPasswordSaveBound = 'true';
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
                    passwordModal?.classList.remove('active');
                    clearPasswordForm();
                } catch (error) {
                    showPasswordError(error.message || 'Không thể đổi mật khẩu.');
                }
            });
        }

        document.querySelectorAll('.close-modal').forEach((btn) => {
            btn.addEventListener('click', () => {
                profileModal?.classList.remove('active');
                passwordModal?.classList.remove('active');
                clearPasswordForm();
            });
        });
        const logoutItem = document.querySelector('.logout-item');
        if (logoutItem && logoutItem.dataset.kidCityLogoutBound !== 'true') {
            logoutItem.dataset.kidCityLogoutBound = 'true';
        logoutItem.addEventListener('click', () => {
            if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('currentRole');
            window.location.href = window.getKidCityLoginPath ? window.getKidCityLoginPath() : '../../login.html';
        });
        }
        window.addEventListener('click', (event) => {
            closeAllDropdowns();
            if (event.target.classList.contains('modal-overlay')) {
                event.target.classList.remove('active');
                if (event.target === passwordModal) clearPasswordForm();
            }
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
                const period = row.dataset.period || '';
                const matchKeyword = !keyword || text.includes(keyword);
                const matchFilter = selected === 'all' || !selected || period.split(/\s+/).includes(selected);
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

    const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}\u0111`;

    const formatReportDate = (value) => {
        if (!value) return '-';
        const date = new Date(`${value}T00:00:00`);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
    };

    const getCustomerGroup = (item) => {
        const spent = Number(item.total_spent || 0);
        const orders = Number(item.order_count || 0);
        if (spent >= 500000 || orders >= 3) return 'VIP';
        if (orders >= 2) return 'Th\u00e2n thi\u1ebft';
        if (orders === 1) return '\u0110\u00e3 mua';
        return 'Ch\u01b0a mua';
    };

    const compactMoney = (value) => {
        const amount = Number(value || 0);
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1).replace('.', ',')}tr`;
        if (amount >= 1000) return `${Math.round(amount / 1000)}k`;
        return formatMoney(amount);
    };

    const renderRevenuePanels = (page, rows, totalRevenue, totalOrders) => {
        const chart = page.querySelector('[data-revenue-chart]');
        if (chart) {
            const maxRevenue = Math.max(...rows.map((item) => Number(item.revenue || 0)), 1);
            chart.innerHTML = rows.length ? rows.slice(-8).map((item) => {
                const height = Math.max(12, Math.round(Number(item.revenue || 0) / maxRevenue * 100));
                return `<div style="--h:${height}%"><span>${compactMoney(item.revenue)}</span><b>${formatReportDate(item.invoice_date).slice(0, 5)}</b></div>`;
            }).join('') : '<p class="report-empty-inline">Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u doanh thu.</p>';
        }
        const summary = page.querySelector('[data-revenue-summary]');
        if (summary) {
            const averageOrder = totalOrders ? totalRevenue / totalOrders : 0;
            summary.innerHTML = `<div><strong>T\u1ed5ng h\u00f3a \u0111\u01a1n</strong><span>${totalOrders}</span><i style="width:100%"></i></div><div><strong>Doanh thu</strong><span>${formatMoney(totalRevenue)}</span><i style="width:100%"></i></div><div><strong>Trung b\u00ecnh / h\u00f3a \u0111\u01a1n</strong><span>${formatMoney(averageOrder)}</span><i style="width:${averageOrder ? 70 : 0}%"></i></div>`;
        }
    };

    const renderTopCustomers = (page, rows) => {
        const list = page.querySelector('[data-customer-rank]');
        if (!list) return;
        const topRows = [...rows].sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0)).slice(0, 5);
        const maxSpent = Math.max(...topRows.map((item) => Number(item.total_spent || 0)), 1);
        list.innerHTML = topRows.length ? topRows.map((item) => {
            const width = Math.max(8, Math.round(Number(item.total_spent || 0) / maxSpent * 100));
            return `<div><strong>${item.name || '-'}</strong><span>${formatMoney(item.total_spent)}</span><i style="width:${width}%"></i></div>`;
        }).join('') : '<p class="report-empty-inline">Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u kh\u00e1ch h\u00e0ng.</p>';
    };

    const loadReportFromApi = async () => {
        const page = document.querySelector('.reports-page');
        if (!page || !window.kidCityApi) return;
        const type = page.dataset.reportPage;
        const table = page.querySelector('[data-report-table]');
        if (!table) return;

        try {
            if (type === 'revenue') {
                const rows = await window.kidCityApi.get('reports/revenue.php?from=1900-01-01&to=2999-12-31');
                if (!Array.isArray(rows)) return;
                const totalRevenue = rows.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
                const totalOrders = rows.reduce((sum, item) => sum + Number(item.orders || 0), 0);
                const cards = page.querySelectorAll('.stat-card h3');
                if (cards[0]) cards[0].textContent = formatMoney(totalRevenue);
                if (cards[1]) cards[1].textContent = formatMoney(totalRevenue * 0.33);
                if (cards[2]) cards[2].textContent = totalOrders;
                if (cards[3]) cards[3].textContent = formatMoney(totalOrders ? totalRevenue / totalOrders : 0);
                renderRevenuePanels(page, rows, totalRevenue, totalOrders);
                table.innerHTML = rows.map((item) => `
                    <tr data-period="all today last7 this-month last-month">
                        <td class="fw-bold">${formatReportDate(item.invoice_date)}</td>
                        <td class="fw-bold">${formatMoney(item.revenue)}</td>
                        <td>${item.orders || 0}</td>
                        <td class="text-green fw-bold">${formatMoney(Number(item.revenue || 0) * 0.33)}</td>
                        <td class="text-green">T\u1eeb database</td>
                        <td>${totalOrders} hóa đơn</td>
                    </tr>
                `).join('');
                bindReportFilters();
            }

            if (type === 'products') {
                const rows = await window.kidCityApi.get('reports/products.php');
                if (!Array.isArray(rows)) return;
                const cards = page.querySelectorAll('.stat-card h3');
                if (cards[0]) cards[0].textContent = rows.length;
                if (cards[2]) cards[2].textContent = rows.filter((item) => Number(item.stock || 0) <= 5).length;
                if (cards[3]) cards[3].textContent = formatMoney(rows.reduce((sum, item) => sum + Number(item.revenue || 0), 0));
                table.innerHTML = rows.map((item) => `
                    <tr data-period="all today last7 this-month last-month">
                        <td class="fw-bold text-blue">${item.code || ''}</td>
                        <td>${item.name || ''}</td>
                        <td>${item.category_name || ''}</td>
                        <td>${item.sold_quantity || 0}</td>
                        <td>${item.stock || 0}</td>
                        <td class="fw-bold">${formatMoney(item.revenue)}</td>
                        <td><span class="report-badge ${Number(item.stock || 0) <= 5 ? 'warn' : 'good'}">${Number(item.stock || 0) <= 5 ? 'Sắp hết' : 'Còn hàng'}</span></td>
                    </tr>
                `).join('');
                bindReportFilters();
            }

            if (type === 'customers') {
                const rows = await window.kidCityApi.get('reports/customers.php');
                if (!Array.isArray(rows)) return;
                const cards = page.querySelectorAll('.stat-card h3');
                if (cards[0]) cards[0].textContent = rows.length;
                const totalOrders = rows.reduce((sum, item) => sum + Number(item.order_count || 0), 0);
                const totalSpent = rows.reduce((sum, item) => sum + Number(item.total_spent || 0), 0);
                if (cards[1]) cards[1].textContent = rows.filter((item) => Number(item.order_count || 0) >= 2).length;
                if (cards[2]) cards[2].textContent = formatMoney(totalSpent);
                if (cards[3]) cards[3].textContent = formatMoney(totalOrders ? totalSpent / totalOrders : 0);
                renderTopCustomers(page, rows);
                table.innerHTML = rows.map((item) => `
                    <tr data-period="all today last7 this-month last-month">
                        <td class="fw-bold text-blue">${item.code || ''}</td>
                        <td>${item.name || ''}</td>
                        <td>${item.phone || ''}</td>
                        <td>${item.order_count || 0}</td>
                        <td class="fw-bold">${formatMoney(item.total_spent)}</td>
                        <td>${formatReportDate(item.last_purchase)}</td>
                        <td><span class="report-badge good">${getCustomerGroup(item)}</span></td>
                    </tr>
                `).join('');
                bindReportFilters();
            }
        } catch (error) {
            console.warn('Khong the tai bao cao tu API:', error.message);
        }
    };

    const ensureReportToast = () => {
        let toast = document.getElementById('report-export-toast');
        if (toast) return toast;
        toast = document.createElement('div');
        toast.id = 'report-export-toast';
        toast.className = 'report-toast';
        toast.innerHTML = `<i class="bx bx-check-circle"></i><span></span>`;
        document.body.appendChild(toast);
        return toast;
    };

    const showReportToast = (message) => {
        const toast = ensureReportToast();
        const label = toast.querySelector('span');
        if (label) label.textContent = message;
        toast.classList.add('show');
        window.clearTimeout(toast._hideTimer);
        toast._hideTimer = window.setTimeout(() => toast.classList.remove('show'), 2600);
    };

    const escapeExcelText = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const getVisibleRevenueRows = (page) => Array.from(page.querySelectorAll('[data-report-table] tr'))
        .filter((row) => row.style.display !== 'none' && !row.classList.contains('report-empty'));

    const buildRevenueExcelHtml = (page) => {
        const title = page.querySelector('.page-header h2')?.textContent.trim() || 'Bao cao doanh thu';
        const generatedAt = new Date().toLocaleString('vi-VN');
        const cards = Array.from(page.querySelectorAll('.stat-card')).map((card) => ({
            label: card.querySelector('.stat-info p')?.textContent.trim() || '',
            value: card.querySelector('.stat-info h3')?.textContent.trim() || '',
            note: card.querySelector('.stat-info span')?.textContent.trim() || ''
        }));
        const table = page.querySelector('.reports-table');
        const headers = Array.from(table?.querySelectorAll('thead th') || []).map((cell) => cell.textContent.trim());
        const rows = getVisibleRevenueRows(page).map((row) => Array.from(row.cells).map((cell) => cell.textContent.trim()));

        const summaryRows = cards.map((item) => `
            <tr>
                <td>${escapeExcelText(item.label)}</td>
                <td>${escapeExcelText(item.value)}</td>
                <td>${escapeExcelText(item.note)}</td>
            </tr>
        `).join('');
        const headerHtml = headers.map((header) => `<th>${escapeExcelText(header)}</th>`).join('');
        const bodyHtml = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeExcelText(cell)}</td>`).join('')}</tr>`).join('');

        return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
    body{font-family:Arial,sans-serif;color:#111827;}
    h1{font-size:22px;margin:0 0 6px;}
    p{margin:0 0 16px;color:#475569;}
    table{border-collapse:collapse;width:100%;margin-bottom:20px;}
    th{background:#2563eb;color:#fff;font-weight:700;}
    th,td{border:1px solid #dbe3ef;padding:10px;text-align:left;}
    .summary th{background:#0f172a;}
</style>
</head>
<body>
    <h1>${escapeExcelText(title)}</h1>
    <p>Th\u1eddi gian xu\u1ea5t: ${escapeExcelText(generatedAt)}</p>
    <table class="summary">
        <thead><tr><th>Ch\u1ec9 s\u1ed1</th><th>Gi\u00e1 tr\u1ecb</th><th>Ghi ch\u00fa</th></tr></thead>
        <tbody>${summaryRows}</tbody>
    </table>
    <table>
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${bodyHtml || `<tr><td colspan="${headers.length || 1}">Kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u \u0111\u1ec3 xu\u1ea5t</td></tr>`}</tbody>
    </table>
</body>
</html>`;
    };

    const downloadExcelFile = (html, filename) => {
        const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const bindExport = () => {
        document.querySelectorAll('[data-export-report]').forEach((btn) => {
            if (btn.dataset.reportExportBound === 'true') return;
            btn.dataset.reportExportBound = 'true';
            btn.addEventListener('click', () => {
                const page = document.querySelector('.reports-page[data-report-page="revenue"]');
                if (!page) return;
                const today = new Date().toISOString().slice(0, 10);
                downloadExcelFile(buildRevenueExcelHtml(page), `bao-cao-doanh-thu-${today}.xls`);
                showReportToast('\u0110\u00e3 xu\u1ea5t b\u00e1o c\u00e1o doanh thu th\u00e0nh c\u00f4ng!');
            });
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        bindHeader();
        bindReportFilters();
        loadReportFromApi();
        bindExport();
    });
})();
