/* =========================
   DATA
========================= */

const customers = [
    {
        maKhachHang: "KH001",
        tenKhachHang: "Nguyễn Minh Anh",
        soDienThoai: "0987654321",
        ngayTao: "2026-05-01",
        ngayCapNhat: "2026-05-10"
    },

    {
        maKhachHang: "KH002",
        tenKhachHang: "Trần Hoàng Nam",
        soDienThoai: "0971112233",
        ngayTao: "2026-05-02",
        ngayCapNhat: "2026-05-08"
    },

    {
        maKhachHang: "KH003",
        tenKhachHang: "Lê Gia Hân",
        soDienThoai: "0962233445",
        ngayTao: "2026-05-03",
        ngayCapNhat: "2026-05-11"
    },

    {
        maKhachHang: "KH004",
        tenKhachHang: "Phạm Đức Long",
        soDienThoai: "0934455667",
        ngayTao: "2026-05-04",
        ngayCapNhat: "2026-05-12"
    },

    {
        maKhachHang: "KH005",
        tenKhachHang: "Võ Ngọc Linh",
        soDienThoai: "0912345678",
        ngayTao: "2026-05-06",
        ngayCapNhat: "2026-05-09"
    },

    {
        maKhachHang: "KH006",
        tenKhachHang: "Đặng Quốc Bảo",
        soDienThoai: "0909988776",
        ngayTao: "2026-05-07",
        ngayCapNhat: "2026-05-12"
    },

    {
        maKhachHang: "KH007",
        tenKhachHang: "Bùi Thanh Thảo",
        soDienThoai: "0988111222",
        ngayTao: "2026-05-08",
        ngayCapNhat: "2026-05-13"
    },

    {
        maKhachHang: "KH008",
        tenKhachHang: "Hoàng Nhật Minh",
        soDienThoai: "0977444555",
        ngayTao: "2026-05-09",
        ngayCapNhat: "2026-05-14"
    }
];

const purchaseHistory = [
    {
        maKhachHang: "KH001",
        maHoaDon: "HD001",
        tongTien: 450000,
        ngayMua: "2026-05-02"
    },

    {
        maKhachHang: "KH001",
        maHoaDon: "HD002",
        tongTien: 780000,
        ngayMua: "2026-05-05"
    },

    {
        maKhachHang: "KH002",
        maHoaDon: "HD003",
        tongTien: 250000,
        ngayMua: "2026-05-06"
    },

    {
        maKhachHang: "KH003",
        maHoaDon: "HD004",
        tongTien: 920000,
        ngayMua: "2026-05-07"
    },

    {
        maKhachHang: "KH004",
        maHoaDon: "HD005",
        tongTien: 330000,
        ngayMua: "2026-05-08"
    },

    {
        maKhachHang: "KH005",
        maHoaDon: "HD006",
        tongTien: 1500000,
        ngayMua: "2026-05-09"
    },

    {
        maKhachHang: "KH006",
        maHoaDon: "HD007",
        tongTien: 690000,
        ngayMua: "2026-05-10"
    },

    {
        maKhachHang: "KH007",
        maHoaDon: "HD008",
        tongTien: 820000,
        ngayMua: "2026-05-11"
    }
];

/* =========================
   RENDER TABLE
========================= */

function renderCustomers(data = customers){

    const tbody =
        document.getElementById("customerTableBody");

    tbody.innerHTML = "";

    data.forEach(customer => {

        tbody.innerHTML += `
        
            <tr>

                <td>${customer.maKhachHang}</td>

                <td>${customer.tenKhachHang}</td>

                <td>${customer.soDienThoai}</td>

                <td>${formatDate(customer.ngayTao)}</td>

                <td>${formatDate(customer.ngayCapNhat)}</td>

                <td>

                    <div class="table-actions">

                        <button class="action-btn view-btn"
                                onclick="viewCustomer('${customer.maKhachHang}')">

                            <i class='bx bx-show'></i>

                        </button>

                        <button class="action-btn edit-btn"
                                onclick="editCustomer('${customer.maKhachHang}')">

                            <i class='bx bx-edit'></i>

                        </button>

                    </div>

                </td>

            </tr>
        
        `;
    });

    updateStats();
}

/* =========================
   STATS
========================= */

function updateStats(){

    document.getElementById("totalCustomers").innerText =
        customers.length;

    const currentMonth = "2026-05";

    const newCustomers =
        customers.filter(customer =>
            customer.ngayTao.startsWith(currentMonth)
        );

    document.getElementById("newCustomers").innerText =
        newCustomers.length;

    document.getElementById("totalOrders").innerText =
        purchaseHistory.length;

    const avg =
        purchaseHistory.length / customers.length;

    document.getElementById("avgOrders").innerText =
        avg.toFixed(1);
}

/* =========================
   SEARCH + FILTER
========================= */

function filterCustomers(){

    const keyword =
        document.getElementById("searchCustomer")
        .value
        .toLowerCase();

    const fromDate =
        document.getElementById("fromDate").value;

    const toDate =
        document.getElementById("toDate").value;

    const filtered =
        customers.filter(customer => {

            const matchKeyword =

                customer.tenKhachHang
                .toLowerCase()
                .includes(keyword)

                ||

                customer.soDienThoai
                .includes(keyword)

                ||

                customer.maKhachHang
                .toLowerCase()
                .includes(keyword);

            let matchDate = true;

            if(fromDate && toDate){

                matchDate =

                    customer.ngayTao >= fromDate

                    &&

                    customer.ngayTao <= toDate;
            }

            return matchKeyword && matchDate;
        });

    renderCustomers(filtered);
}

/* =========================
   LIVE SEARCH
========================= */

document
    .getElementById("searchCustomer")
    .addEventListener("keyup", filterCustomers);

/* =========================
   OPEN ADD MODAL
========================= */

function openAddModal(){

    document.getElementById("modalTitle").innerText =
        "Thêm khách hàng";

    document.getElementById("customerId").value = "";

    document.getElementById("customerName").value = "";

    document.getElementById("customerPhone").value = "";

    document
        .getElementById("customerModal")
        .classList.add("show");
}

/* =========================
   CLOSE MODALS
========================= */

function closeCustomerModal(){

    document
        .getElementById("customerModal")
        .classList.remove("show");
}

function closeDetailModal(){

    document
        .getElementById("detailModal")
        .classList.remove("show");
}

/* =========================
   EDIT CUSTOMER
========================= */

function editCustomer(id){

    const customer =
        customers.find(
            customer =>
                customer.maKhachHang === id
        );

    document.getElementById("modalTitle").innerText =
        "Chỉnh sửa khách hàng";

    document.getElementById("customerId").value =
        customer.maKhachHang;

    document.getElementById("customerName").value =
        customer.tenKhachHang;

    document.getElementById("customerPhone").value =
        customer.soDienThoai;

    document
        .getElementById("customerModal")
        .classList.add("show");
}

/* =========================
   SAVE CUSTOMER
========================= */

function saveCustomer(){

    const id =
        document.getElementById("customerId").value;

    const name =
        document.getElementById("customerName").value;

    const phone =
        document.getElementById("customerPhone").value;

    if(!name || !phone){

        alert("Vui lòng nhập đầy đủ thông tin");

        return;
    }

    if(id){

        const customer =
            customers.find(
                customer =>
                    customer.maKhachHang === id
            );

        customer.tenKhachHang = name;

        customer.soDienThoai = phone;

        customer.ngayCapNhat =
            getToday();

    }else{

        const newId =
            "KH" +
            String(customers.length + 1)
            .padStart(3, "0");

        customers.push({

            maKhachHang: newId,

            tenKhachHang: name,

            soDienThoai: phone,

            ngayTao: getToday(),

            ngayCapNhat: getToday()
        });
    }

    closeCustomerModal();

    renderCustomers();
}

/* =========================
   VIEW CUSTOMER
========================= */

function viewCustomer(id){

    const customer =
        customers.find(
            customer =>
                customer.maKhachHang === id
        );

    document.getElementById("customerDetail").innerHTML = `

        <div class="info-item">

            <div class="info-label">
                Mã khách hàng
            </div>

            <div class="info-value">
                ${customer.maKhachHang}
            </div>

        </div>

        <div class="info-item">

            <div class="info-label">
                Tên khách hàng
            </div>

            <div class="info-value">
                ${customer.tenKhachHang}
            </div>

        </div>

        <div class="info-item">

            <div class="info-label">
                Số điện thoại
            </div>

            <div class="info-value">
                ${customer.soDienThoai}
            </div>

        </div>

        <div class="info-item">

            <div class="info-label">
                Ngày tạo
            </div>

            <div class="info-value">
                ${formatDate(customer.ngayTao)}
            </div>

        </div>

        <div class="info-item">

            <div class="info-label">
                Ngày cập nhật
            </div>

            <div class="info-value">
                ${formatDate(customer.ngayCapNhat)}
            </div>

        </div>
    `;

    const history =
        purchaseHistory.filter(
            item =>
                item.maKhachHang === id
        );

    const tbody =
        document.getElementById("purchaseHistoryBody");

    tbody.innerHTML = "";

    if(history.length === 0){

        tbody.innerHTML = `
        
            <tr>

                <td colspan="4"
                    style="text-align:center;">

                    Chưa có lịch sử mua hàng

                </td>

            </tr>
        
        `;

    }else{

        history.forEach(item => {

            tbody.innerHTML += `
            
                <tr>

                    <td>${item.maKhachHang}</td>

                    <td>

                        <a href="../sales/invoices.html?id=${item.maHoaDon}"
                           class="invoice-link">

                            ${item.maHoaDon}

                        </a>

                    </td>

                    <td>

                        ${item.tongTien.toLocaleString()}đ

                    </td>

                    <td>

                        ${formatDate(item.ngayMua)}

                    </td>

                </tr>
            
            `;
        });
    }

    document
        .getElementById("detailModal")
        .classList.add("show");
}

/* =========================
   FORMAT DATE
========================= */

function formatDate(dateString){

    const date = new Date(dateString);

    return date.toLocaleDateString("vi-VN");
}

/* =========================
   GET TODAY
========================= */

function getToday(){

    return new Date()
        .toISOString()
        .split("T")[0];
}

/* =========================
   CLOSE MODAL WHEN CLICK OUTSIDE
========================= */

window.onclick = function(event){

    const customerModal =
        document.getElementById("customerModal");

    const detailModal =
        document.getElementById("detailModal");

    if(event.target === customerModal){

        closeCustomerModal();
    }

    if(event.target === detailModal){

        closeDetailModal();
    }
}

/* =========================
   INIT
========================= */

renderCustomers();