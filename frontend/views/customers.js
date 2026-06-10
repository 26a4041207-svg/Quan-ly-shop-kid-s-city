/* =========================
   DATA
========================= */

let customers = [];
let purchaseHistory = [];
const invoiceDetails = {};

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
        customers.length ? purchaseHistory.length / customers.length : 0;

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

            const searchable = [
                customer.maKhachHang,
                customer.tenKhachHang,
                customer.soDienThoai,
                customer.ngayTao,
                customer.ngayCapNhat,
                customer.soDonHang,
                customer.tongChiTieu
            ].join(" ").toLowerCase();

            const matchKeyword = searchable.includes(keyword);

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

document.addEventListener("click", event => {

    const invoiceLink =
        event.target.closest(".invoice-link");

    if(!invoiceLink) return;

    event.preventDefault();

    openInvoiceDetailModal(
        invoiceLink.textContent.trim()
    );
});

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

function closeInvoiceDetailModal(){

    const modal =
        document.getElementById("invoiceDetailModal");

    if(modal){

        modal.remove();
    }
}

function openInvoiceDetailModal(invoiceCode){

    const invoice =
        invoiceDetails[invoiceCode];

    if(!invoice){

        alert("Không tìm thấy chi tiết hóa đơn " + invoiceCode);

        return;
    }

    closeInvoiceDetailModal();

    const rows =
        invoice.items
            .map(item => `

                <tr>
                    <td>${item[0]}</td>
                    <td>${item[1]}</td>
                    <td>${item[2]}</td>
                    <td>${item[3]}</td>
                    <td><strong>${item[4]}</strong></td>
                </tr>

            `)
            .join("");

    const modal =
        document.createElement("div");

    modal.className = "sales-modal active";
    modal.id = "invoiceDetailModal";

    modal.innerHTML = `

        <div class="sales-dialog detail">
            <div class="sales-modal-body">

                <h2 class="detail-title">
                    Chi tiết hóa đơn ${invoiceCode}
                </h2>

                <div class="detail-grid">
                    <div class="detail-item">
                        <span>Khách hàng</span>
                        <strong>${invoice.customer}</strong>
                    </div>

                    <div class="detail-item">
                        <span>Nhân viên</span>
                        <strong>${invoice.staff}</strong>
                    </div>

                    <div class="detail-item">
                        <span>Ngày lập</span>
                        <strong>${invoice.date}</strong>
                    </div>

                    <div class="detail-item">
                        <span>Phương thức thanh toán</span>
                        <strong>${invoice.payment}</strong>
                    </div>

                    <div class="detail-item">
                        <span>Ghi chú</span>
                        <strong>${invoice.note}</strong>
                    </div>
                </div>

                <h3 class="section-title">
                    Chi tiết sản phẩm
                </h3>

                <table class="sales-table">
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Đơn giá</th>
                            <th>SL</th>
                            <th>Giảm giá</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>

                <div class="total-line">
                    Tổng tiền: <span>${invoice.total}</span>
                </div>

                <button class="sales-btn primary block"
                        onclick="closeInvoiceDetailModal()">
                    Đóng
                </button>

            </div>
        </div>
    `;

    modal.addEventListener("click", event => {

        if(event.target === modal){

            closeInvoiceDetailModal();
        }
    });

    document.body.appendChild(modal);
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
        "Cập nhật khách hàng";

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

async function saveCustomer(){

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

    if(window.kidCityApi){
        try{
            if(id){
                const customer = customers.find(customer => customer.maKhachHang === id);
                await window.kidCityApi.put("customers/index.php", {
                    id: customer?.dbId,
                    code: id,
                    name,
                    phone
                });
            }else{
                const nextNumber = customers.reduce((max, customer) => {
                    const number = Number(String(customer.maKhachHang || "").replace(/\D/g, ""));
                    return Number.isFinite(number) ? Math.max(max, number) : max;
                }, 0) + 1;
                await window.kidCityApi.post("customers/index.php", {
                    code: `KH${String(nextNumber).padStart(3, "0")}`,
                    name,
                    phone
                });
            }

            closeCustomerModal();
            await loadCustomersFromApi();
            return;
        }catch(error){
            alert(error.message || "Không thể lưu khách hàng.");
            return;
        }
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

        <div class="detail-item">
            <span>Mã khách hàng</span>
            <strong>${customer.maKhachHang}</strong>
        </div>

        <div class="detail-item">
            <span>Tên khách hàng</span>
            <strong>${customer.tenKhachHang}</strong>
        </div>

        <div class="detail-item">
            <span>Số điện thoại</span>
            <strong>${customer.soDienThoai}</strong>
        </div>

        <div class="detail-item">
            <span>Ngày tạo</span>
            <strong>${formatDate(customer.ngayTao)}</strong>
        </div>

        <div class="detail-item">
            <span>Ngày cập nhật</span>
            <strong>${formatDate(customer.ngayCapNhat)}</strong>
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

                        <a href="#"
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

async function loadCustomersFromApi(){

    if(!window.kidCityApi) return;

    try{

        const [apiCustomers, invoices] = await Promise.all([
            window.kidCityApi.get("customers/index.php"),
            window.kidCityApi.get("sales/invoices.php")
        ]);

        if(Array.isArray(apiCustomers)){

            customers = apiCustomers.map((customer, index) => ({
                dbId: customer.id,
                maKhachHang: customer.code || `KH${String(index + 1).padStart(3, "0")}`,
                tenKhachHang: customer.name || "",
                soDienThoai: customer.phone || "",
                ngayTao: (customer.created_at || "").slice(0, 10),
                ngayCapNhat: (customer.updated_at || customer.created_at || "").slice(0, 10)
            }));
        }

        if(Array.isArray(invoices)){

            const customerCodeById = new Map(
                customers.map(customer => [String(customer.dbId || ""), customer.maKhachHang])
            );

            purchaseHistory = invoices.map(invoice => ({
                maKhachHang: customerCodeById.get(String(invoice.customer_id || "")) || "",
                maHoaDon: invoice.code || "",
                tongTien: Number(invoice.total || 0),
                ngayMua: invoice.invoice_date || ""
            })).filter(item => item.maHoaDon);

            invoices.forEach(invoice => {
                if(!invoice.code) return;
                invoiceDetails[invoice.code] = {
                    customer: invoice.customer_name || "",
                    staff: invoice.staff_name || "",
                    date: invoice.invoice_date || "",
                    payment: invoice.payment_method || "",
                    note: invoice.note || "Không có",
                    total: `${Number(invoice.total || 0).toLocaleString("vi-VN")}đ`,
                    items: (invoice.items || []).map(item => [
                        item.product_name || item.product_code || "",
                        `${Number(item.price || 0).toLocaleString("vi-VN")}đ`,
                        String(item.quantity || 1),
                        `${Number(item.discount || 0).toLocaleString("vi-VN")}đ`,
                        `${Number(item.line_total || 0).toLocaleString("vi-VN")}đ`
                    ])
                };
            });
        }

        renderCustomers();

    }catch(error){

        console.warn("Khong the tai khach hang tu API:", error.message);
    }
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

customers = [];
purchaseHistory = [];
Object.keys(invoiceDetails).forEach(key => delete invoiceDetails[key]);
renderCustomers();
loadCustomersFromApi();
