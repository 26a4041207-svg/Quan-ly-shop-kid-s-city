(function () {
    const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
    const formatDate = (value) => {
        if (!value) return '';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
    };

    window.initDashboardPage = async function initDashboardPage(container) {
        const root = container.querySelector('.dashboard-header')?.parentElement || container;
        if (!root || root.dataset.dashboardReady === 'true' || !window.kidCityApi) return;
        root.dataset.dashboardReady = 'true';

        try {
            const [stats, recentOrders, topProducts] = await Promise.all([
                window.kidCityApi.get('dashboard/stats.php'),
                window.kidCityApi.get('dashboard/recent_orders.php'),
                window.kidCityApi.get('dashboard/top_products.php')
            ]);

            const kpis = root.querySelectorAll('.kpi-value');
            if (kpis[0]) kpis[0].textContent = formatMoney(stats.todayRevenue || stats.revenue || 0);
            if (kpis[1]) kpis[1].textContent = stats.todayOrders ?? stats.orders ?? 0;
            if (kpis[2]) kpis[2].textContent = stats.customers ?? 0;
            if (kpis[3]) kpis[3].textContent = stats.products ?? 0;

            const orderBody = root.querySelector('.dash-table tbody');
            if (orderBody && Array.isArray(recentOrders)) {
                orderBody.innerHTML = recentOrders.map((order) => `
                    <tr>
                        <td class="order-id">${order.code || ''}</td>
                        <td>${order.customer_name || ''}</td>
                        <td class="fw-bold">${formatMoney(order.total)}</td>
                        <td>${formatDate(order.invoice_date || order.created_at)}</td>
                    </tr>
                `).join('');
                const orderCount = root.querySelector('.dash-card-header p');
                if (orderCount) orderCount.textContent = `${recentOrders.length} đơn hàng gần đây`;
            }

            const topList = root.querySelector('.top-products-list');
            if (topList && Array.isArray(topProducts)) {
                topList.innerHTML = topProducts.map((product, index) => `
                    <li>
                        <div class="rank rank-${Math.min(index + 1, 5)}">${index + 1}</div>
                        <div class="prod-info">
                            <h4>${product.name || product.product_name || ''}</h4>
                            <p>Đã bán: ${product.sold_quantity || product.quantity || 0} sản phẩm</p>
                        </div>
                        <div class="prod-revenue">
                            <strong>${formatMoney(product.revenue || product.total)}</strong>
                            <span>doanh thu</span>
                        </div>
                    </li>
                `).join('');
            }
        } catch (error) {
            console.warn('Khong the tai du lieu dashboard tu API:', error.message);
        }
    };
})();
