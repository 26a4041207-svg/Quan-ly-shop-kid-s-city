// ==========================================
// HÀM KHỞI TẠO BIỂU ĐỒ BÁO CÁO SẢN PHẨM
// ==========================================
window.initProductReportCharts = function() {
    
    // 1. BIỂU ĐỒ CỘT: TOP SẢN PHẨM BÁN CHẠY
    const ctxTopProducts = document.getElementById('topProductsChart');
    if (ctxTopProducts) {
        new Chart(ctxTopProducts, {
            type: 'bar',
            data: {
                labels: ['Áo thun basic', 'Búp bê công chúa', 'Quần jean slim', 'Váy hoa', 'Bộ thể thao'],
                datasets: [{
                    label: 'Đã bán',
                    data: [120, 95, 80, 75, 60],
                    backgroundColor: '#3b82f6', // Màu xanh dương
                    borderRadius: 6,
                    barPercentage: 0.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return 'Số lượng: ' + context.parsed.y + ' SP'; }
                        }
                    }
                },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // 2. BIỂU ĐỒ TRÒN (DOUGHNUT): TỶ TRỌNG DOANH THU THEO DANH MỤC
    const ctxCategory = document.getElementById('categoryShareChart');
    if (ctxCategory) {
        new Chart(ctxCategory, {
            type: 'doughnut',
            data: {
                labels: ['Bé trai', 'Bé gái', 'Đồ chơi', 'Phụ kiện'],
                datasets: [{
                    data: [45, 30, 15, 10], // Tính theo %
                    backgroundColor: [
                        '#3b82f6', // Bé trai - xanh
                        '#ec4899', // Bé gái - hồng
                        '#f59e0b', // Đồ chơi - cam
                        '#8b5cf6'  // Phụ kiện - tím
                    ],
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%', // Làm rỗng ruột ở giữa
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return context.label + ': ' + context.parsed + '%'; }
                        }
                    }
                }
            }
        });
    }

    // 3. BIỂU ĐỒ ĐƯỜNG: XU HƯỚNG TỒN KHO
    const ctxInventory = document.getElementById('inventoryTrendChart');
    if (ctxInventory) {
        new Chart(ctxInventory, {
            type: 'line',
            data: {
                labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
                datasets: [{
                    label: 'Số lượng tồn kho',
                    data: [1100, 1050, 1200, 1150, 900, 1245, 1300, 1250, 1400, 1350, 1100, 950],
                    borderColor: '#f59e0b', // Màu cam
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#f59e0b',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4 // Đường cong mềm
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) { return 'Tồn kho: ' + context.parsed.y + ' SP'; }
                        }
                    }
                },
                scales: { y: { beginAtZero: false } }
            }
        });
    }
};