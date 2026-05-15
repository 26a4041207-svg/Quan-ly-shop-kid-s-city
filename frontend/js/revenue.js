// ==========================================
// HÀM KHỞI TẠO BIỂU ĐỒ TRANG BÁO CÁO
// ==========================================
window.initReportCharts = function() {
    // 1. Dữ liệu (Lấy chính xác từ ảnh thiết kế)
    const labels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const revenueData = [12500000, 15800000, 13200000, 18900000, 21300000, 16700000, 24500000, 22100000, 19600000, 27300000, 31200000, 38500000];
    const profitData = [4200000, 5300000, 4450000, 6350000, 7100000, 5600000, 8200000, 7400000, 6500000, 9100000, 10400000, 12800000];
    const orderData = [48, 62, 51, 74, 83, 65, 96, 87, 77, 107, 122, 151];

    // Cấu hình định dạng tiền tệ VNĐ cho Tooltip
    const currencyFormat = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
    };

    // 2. BIỂU ĐỒ DOANH THU & LỢI NHUẬN (CỘT)
    const ctxRevenue = document.getElementById('revenueProfitChart');
    if (ctxRevenue) {
        new Chart(ctxRevenue, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Doanh thu',
                        data: revenueData,
                        backgroundColor: '#2563eb', // Màu xanh dương
                        borderRadius: 4,
                        barPercentage: 0.6
                    },
                    {
                        label: 'Lợi nhuận',
                        data: profitData,
                        backgroundColor: '#10b981', // Màu xanh lá
                        borderRadius: 4,
                        barPercentage: 0.6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += currencyFormat(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value / 1000000 + 'tr'; // Hiển thị "tr" (triệu) ở cột Y
                            }
                        }
                    }
                }
            }
        });
    }

    // 3. BIỂU ĐỒ XU HƯỚNG ĐƠN HÀNG (ĐƯỜNG)
    const ctxOrder = document.getElementById('orderTrendChart');
    if (ctxOrder) {
        new Chart(ctxOrder, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Đơn hàng',
                    data: orderData,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true, // Đổ bóng nhẹ phía dưới đường
                    tension: 0.4 // Làm cong đường nối mềm mại
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }, // Ẩn chú giải vì chỉ có 1 đường
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Đơn hàng: ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
};