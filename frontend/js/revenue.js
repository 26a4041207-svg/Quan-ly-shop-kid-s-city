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
                    
                    // Unblock UI if it was first login
                    const currentUserStr = localStorage.getItem("currentUser");
                    if (currentUserStr) {
                        try {
                            const user = JSON.parse(currentUserStr);
                            user.is_first_login = false;
                            localStorage.setItem("currentUser", JSON.stringify(user));
                        } catch(e) {}
                    }
                    
                    if (passwordModal) {
                        passwordModal.style.pointerEvents = '';
                        const modalContent = passwordModal.querySelector('.modal-content');
                        if (modalContent) modalContent.style.pointerEvents = '';
                        const closeBtns = passwordModal.querySelectorAll('.close-modal');
                        closeBtns.forEach(btn => btn.style.display = '');
                        const headerText = passwordModal.querySelector('.modal-header h3');
                        if (headerText) headerText.textContent = 'Đổi mật khẩu';
                        passwordModal.classList.remove('active');
                    }
                    
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
            let sumInvoice = 0, sumReturn = 0, sumExchange = 0, sumRevenue = 0;

            rows.forEach((row) => {
                if (row.classList.contains('report-empty')) return;
                const text = row.textContent.toLowerCase();
                const period = row.dataset.period || '';
                const matchKeyword = !keyword || text.includes(keyword);
                const matchFilter = selected === 'all' || !selected || period.split(/\s+/).includes(selected);
                const show = matchKeyword && matchFilter;
                row.style.display = show ? '' : 'none';
                if (show) {
                    visible += 1;
                    if (row.dataset.invoice) {
                        sumInvoice += Number(row.dataset.invoice || 0);
                        sumReturn += Number(row.dataset.return || 0);
                        sumExchange += Number(row.dataset.exchange || 0);
                        sumRevenue += Number(row.dataset.revenue || 0);
                    }
                }
            });

            // Nếu là trang revenue, update cards và summary
            if (page.dataset.reportPage === 'revenue') {
                const cards = page.querySelectorAll('.stat-card h3');
                if (cards[0]) cards[0].textContent = formatMoney(sumInvoice);
                if (cards[1]) cards[1].textContent = (sumExchange > 0 ? '+' : '') + formatMoney(sumExchange);
                if (cards[2]) cards[2].textContent = '-' + formatMoney(sumReturn);
                if (cards[3]) cards[3].textContent = formatMoney(sumRevenue);

                const summary = page.querySelector('[data-revenue-summary]');
                if (summary) {
                    summary.innerHTML = `<div><strong>Tổng tiền hóa đơn</strong><span>${formatMoney(sumInvoice)}</span><i style="width:100%"></i></div><div><strong>Tổng tiền trả hàng</strong><span>-${formatMoney(sumReturn)}</span><i style="width:100%; background: #f97316;"></i></div><div><strong>Tổng doanh thu</strong><span>${formatMoney(sumRevenue)}</span><i style="width:100%; background: #22c55e;"></i></div>`;
                }
            }
            
            if (page.dataset.reportPage === 'customers') {
                const cards = page.querySelectorAll('.stat-card h3');
                let sumCustomers = 0;
                let sumOrders = 0;
                let sumSpent = 0;
                rows.forEach((row) => {
                    if (row.style.display !== 'none' && !row.classList.contains('report-empty')) {
                        sumCustomers += 1;
                        sumOrders += Number(row.dataset.orders || 0);
                        sumSpent += Number(row.dataset.spent || 0);
                    }
                });
                
                if (cards[0]) cards[0].textContent = sumCustomers;
                if (cards[1]) cards[1].textContent = formatMoney(sumOrders ? sumSpent / sumOrders : 0);

                const summary = page.querySelector('[data-customer-summary]');
                if (summary) {
                    summary.innerHTML = `<div><strong>Khách hàng mua sắm</strong><span>${sumCustomers} người</span><i style="width:100%"></i></div><div><strong>Tổng số hóa đơn</strong><span>${sumOrders} đơn</span><i style="width:100%; background: #f97316;"></i></div><div><strong>Tổng tiền chi tiêu</strong><span>${formatMoney(sumSpent)}</span><i style="width:100%; background: #22c55e;"></i></div>`;
                }
            }

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
            const totalInvoice = rows.reduce((sum, item) => sum + Number(item.invoice_total || 0), 0);
            const totalReturn = rows.reduce((sum, item) => sum + Number(item.return_total || 0), 0);
            summary.innerHTML = `<div><strong>Tổng tiền hóa đơn</strong><span>${formatMoney(totalInvoice)}</span><i style="width:100%"></i></div><div><strong>Tổng tiền trả hàng</strong><span>${formatMoney(totalReturn)}</span><i style="width:100%; background: #f97316;"></i></div><div><strong>Tổng doanh thu</strong><span>${formatMoney(totalRevenue)}</span><i style="width:100%; background: #22c55e;"></i></div>`;
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

        const getPeriod = (dateString) => {
            if (!dateString) return 'all';
            const d = new Date(dateString);
            const today = new Date();
            const isToday = d.toDateString() === today.toDateString();
            const diffTime = Math.abs(today - d);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isLast7 = diffDays <= 7;
            const isThisMonth = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            const lastMonth = new Date(today); lastMonth.setMonth(today.getMonth() - 1);
            const isLastMonth = d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
            let periods = ['all'];
            if (isToday) periods.push('today');
            if (isLast7) periods.push('last7');
            if (isThisMonth) periods.push('this-month');
            if (isLastMonth) periods.push('last-month');
            return periods.join(' ');
        };

        try {
            if (type === 'revenue') {
                const rows = await window.kidCityApi.get('reports/revenue.php?from=1900-01-01&to=2999-12-31');
                if (!Array.isArray(rows)) return;
                const totalInvoice = rows.reduce((sum, item) => sum + Number(item.invoice_total || 0), 0);
                const totalExchange = rows.reduce((sum, item) => sum + Number(item.exchange_total || 0), 0);
                const totalReturn = rows.reduce((sum, item) => sum + Number(item.return_total || 0), 0);
                const totalRevenue = rows.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
                const totalOrders = rows.reduce((sum, item) => sum + Number(item.orders || 0), 0);

                const cards = page.querySelectorAll('.stat-card h3');
                if (cards[0]) cards[0].textContent = formatMoney(totalInvoice);
                if (cards[1]) cards[1].textContent = formatMoney(totalExchange);
                if (cards[2]) cards[2].textContent = formatMoney(totalReturn);
                renderRevenuePanels(page, rows, totalRevenue, totalOrders);
                table.innerHTML = rows.map((item) => {
                    const exchangeColor = Number(item.exchange_total || 0) >= 0 ? 'text-green' : 'text-red';
                    const exchangeSign = Number(item.exchange_total || 0) > 0 ? '+' : '';
                    return `
                    <tr data-period="${getPeriod(item.invoice_date)}" data-invoice="${item.invoice_total || 0}" data-return="${item.return_total || 0}" data-exchange="${item.exchange_total || 0}" data-revenue="${item.revenue || 0}">
                        <td class="fw-bold">${formatReportDate(item.invoice_date)}</td>
                        <td class="fw-bold">${formatMoney(item.invoice_total)}</td>
                        <td class="text-orange fw-bold">-${formatMoney(item.return_total)}</td>
                        <td class="${exchangeColor} fw-bold">${exchangeSign}${formatMoney(item.exchange_total)}</td>
                        <td class="text-blue fw-bold">${formatMoney(item.revenue)}</td>
                        <td>${item.orders || 0} đơn bán</td>
                    </tr>
                `}).join('');
                bindReportFilters();
            }

            if (type === 'products') {
                const rows = await window.kidCityApi.get('reports/products.php');
                if (!Array.isArray(rows)) return;
                const cards = page.querySelectorAll('.stat-card h3');
                if (cards[0]) cards[0].textContent = rows.length;
                if (cards[1]) cards[1].textContent = rows.filter((item) => Number(item.stock || 0) > 0).length;
                if (cards[2]) cards[2].textContent = rows.filter((item) => Number(item.stock || 0) <= 5).length;
                if (cards[3]) cards[3].textContent = formatMoney(rows.reduce((sum, item) => sum + Number(item.revenue || 0), 0));
                
                const rankList = page.querySelector('.rank-list');
                if (rankList) {
                    const topProducts = [...rows].sort((a, b) => Number(b.sold_quantity) - Number(a.sold_quantity)).slice(0, 5);
                    const maxSold = Math.max(...topProducts.map((item) => Number(item.sold_quantity || 0)), 1);
                    rankList.innerHTML = topProducts.length && maxSold > 0 ? topProducts.map((item) => {
                        const width = Math.max(8, Math.round(Number(item.sold_quantity || 0) / maxSold * 100));
                        return `<div><strong>${item.name || '-'}</strong><span>${item.sold_quantity} đã bán</span><i style="width:${width}%"></i></div>`;
                    }).join('') : '<p class="report-empty-inline">Chưa có dữ liệu bán hàng.</p>';
                }

                const barChart = page.querySelector('.bar-chart.small');
                if (barChart) {
                    const stockByCategory = {};
                    rows.forEach(item => {
                        const cat = item.category_name || 'Khác';
                        stockByCategory[cat] = (stockByCategory[cat] || 0) + Number(item.stock || 0);
                    });
                    const cats = Object.keys(stockByCategory);
                    const maxStock = Math.max(...Object.values(stockByCategory), 1);
                    barChart.innerHTML = cats.length ? cats.slice(0, 7).map(cat => {
                        const stock = stockByCategory[cat];
                        const height = Math.max(12, Math.round(stock / maxStock * 100));
                        return `<div style="--h:${height}%" title="${cat}: ${stock}"><span>${stock}</span><b>${cat.substring(0, 8)}</b></div>`;
                    }).join('') : '<p class="report-empty-inline">Chưa có dữ liệu tồn kho.</p>';
                }

                table.innerHTML = rows.map((item) => `
                    <tr data-period="all today yesterday last7 this-month last-month">
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
                if (cards[1]) cards[1].textContent = formatMoney(totalOrders ? totalSpent / totalOrders : 0);
                renderTopCustomers(page, rows);
                table.innerHTML = rows.map((item) => `
                    <tr data-period="${getPeriod(item.last_purchase)}" data-spent="${item.total_spent || 0}" data-orders="${item.order_count || 0}">
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
