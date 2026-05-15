// =========================
// SUBMENU
// =========================

const menuToggles = document.querySelectorAll(".menu-toggle");

menuToggles.forEach(toggle => {

    toggle.addEventListener("click", (e) => {

        e.preventDefault();

        toggle.parentElement.classList.toggle("open");

    });

});

// =========================
// CATEGORY DATA
// =========================

let categories = [

    "Áo thun",
    "Quần short",
    "Áo khoác"

];

// =========================
// PRODUCT DATA
// =========================

let products = [

    {
        id: "AT001",
        name: "Áo thun bé trai",
        category: "Áo thun",
        size: "M",
        color: "Đỏ",
        price: 250000,
        quantity: 20,
        createdAt: "2025-08-10",
        updatedAt: "2025-08-12",
        status: "selling"
    },

    {
        id: "QS001",
        name: "Quần short kaki",
        category: "Quần short",
        size: "L",
        color: "Đen",
        price: 320000,
        quantity: 5,
        createdAt: "2025-08-11",
        updatedAt: "2025-08-11",
        status: "selling"
    },

    {
        id: "AK001",
        name: "Áo hoodie",
        category: "Áo khoác",
        size: "XL",
        color: "Trắng",
        price: 450000,
        quantity: 0,
        createdAt: "2025-08-01",
        updatedAt: "2025-08-05",
        status: "stopped"
    },
    {
        id: "AT002",
        name: "Áo thun bé gái in hình",
        category: "Áo thun trẻ em",
        size: "S",
        color: "Hồng",
        price: 220000,
        quantity: 18,
        createdAt: "2026-05-16",
        updatedAt: "2026-05-16",
        status: "selling"
    },

    {
        id: "AT003",
        name: "Áo thun cotton tay dài",
        category: "Áo thun trẻ em",
        size: "L",
        color: "Xanh dương",
        price: 280000,
        quantity: 12,
        createdAt: "2026-05-17",
        updatedAt: "2026-05-17",
        status: "selling"
    },

    {
        id: "QS002",
        name: "Quần short kaki bé trai",
        category: "Quần short",
        size: "M",
        color: "Kem",
        price: 300000,
        quantity: 10,
        createdAt: "2026-05-18",
        updatedAt: "2026-05-18",
        status: "selling"
    },

    {
        id: "QS003",
        name: "Quần short jean bé gái",
        category: "Quần short",
        size: "S",
        color: "Xanh nhạt",
        price: 340000,
        quantity: 7,
        createdAt: "2026-05-18",
        updatedAt: "2026-05-19",
        status: "selling"
    },

    {
        id: "VG001",
        name: "Váy hoa công chúa",
        category: "Váy bé gái",
        size: "M",
        color: "Vàng",
        price: 420000,
        quantity: 9,
        createdAt: "2026-05-20",
        updatedAt: "2026-05-20",
        status: "selling"
    },

    {
        id: "VG002",
        name: "Váy ren dự tiệc",
        category: "Váy bé gái",
        size: "L",
        color: "Trắng",
        price: 520000,
        quantity: 4,
        createdAt: "2026-05-21",
        updatedAt: "2026-05-22",
        status: "selling"
    },

    {
        id: "QD001",
        name: "Quần dài thể thao bé trai",
        category: "Quần dài bé trai",
        size: "XL",
        color: "Đen",
        price: 390000,
        quantity: 14,
        createdAt: "2026-05-22",
        updatedAt: "2026-05-22",
        status: "selling"
    },

    {
        id: "QD002",
        name: "Quần jogger cotton",
        category: "Quần dài bé trai",
        size: "M",
        color: "Xám",
        price: 410000,
        quantity: 6,
        createdAt: "2026-05-23",
        updatedAt: "2026-05-23",
        status: "selling"
    },

    {
        id: "AK002",
        name: "Áo khoác phao trẻ em",
        category: "Áo khoác mùa đông",
        size: "L",
        color: "Đỏ đô",
        price: 650000,
        quantity: 3,
        createdAt: "2026-05-24",
        updatedAt: "2026-05-24",
        status: "selling"
    },

    {
        id: "TC001",
        name: "Tất chân hoạt hình",
        category: "Tất chân trẻ em",
        size: "Free Size",
        color: "Nhiều màu",
        price: 80000,
        quantity: 25,
        createdAt: "2026-05-25",
        updatedAt: "2026-05-25",
        status: "selling"
    }

];

let currentEditId = null;
function getTodayDate() {

    return new Date()
        .toISOString()
        .split("T")[0];

}
// =========================
// ELEMENTS
// =========================

const table = document.getElementById("productTable");


const categoryFilter = document.getElementById("categoryFilter");



const minPrice = document.getElementById("minPrice");

const maxPrice = document.getElementById("maxPrice");

const priceRangeText = document.getElementById("priceRangeText");

const modal = document.getElementById("productModal");

const modalTitle = document.getElementById("modalTitle");

const openModalBtn = document.getElementById("openModalBtn");

const closeModalBtn = document.getElementById("closeModalBtn");

const cancelModalBtn = document.getElementById("cancelModalBtn");

const saveProductBtn = document.getElementById("saveProductBtn");

const addCategoryBtn = document.getElementById("addCategoryBtn");

// FORM

const productName = document.getElementById("productName");

const productCategory = document.getElementById("productCategory");

const productSize = document.getElementById("productSize");

const productColor = document.getElementById("productColor");

const productPrice = document.getElementById("productPrice");

const productQuantity = document.getElementById("productQuantity");

const productStatus = document.getElementById("productStatus");

const productCreatedAt = document.getElementById("productCreatedAt");

// =========================
// LOAD CATEGORY
// =========================

function loadCategories() {

    productCategory.innerHTML = `

        <option value="">
            Chọn danh mục
        </option>

    `;

    categoryFilter.innerHTML = `

        <option value="">
            Tất cả danh mục
        </option>

    `;

    categories.forEach(category => {

        productCategory.innerHTML += `

            <option value="${category}">
                ${category}
            </option>

        `;

        categoryFilter.innerHTML += `

            <option value="${category}">
                ${category}
            </option>

        `;

    });

}

loadCategories();

// =========================
// ADD CATEGORY
// =========================

addCategoryBtn.addEventListener("click", () => {

    const newCategory = prompt(
        "Nhập tên danh mục mới"
    );

    if (!newCategory) return;

    const existed = categories.find(category =>

        category.toLowerCase() ===
        newCategory.toLowerCase()

    );

    if (existed) {

        alert("Danh mục đã tồn tại");

        productCategory.value = existed;

        return;

    }

    categories.push(newCategory);

    loadCategories();

    productCategory.value = newCategory;

});

// =========================
// RENDER PRODUCTS
// =========================

function renderProducts(data = products) {

    table.innerHTML = "";

    if (data.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="10" class="empty-data">

                    Không có sản phẩm nào

                </td>

            </tr>

        `;

        return;

    }

    data.forEach(product => {

        table.innerHTML += `

            <tr>

                <td>

                    <div class="product-image">

                        <i class='bx bx-image'></i>

                    </div>

                </td>

                <td>${product.id}</td>

                <td class="font-weight-600">

                    ${product.name}

                </td>

                <td>${product.category}</td>

                <td>

                    <span class="tag">
                        ${product.size || "-"}
                    </span>

                </td>

                <td>

                    <span class="tag">
                        ${product.color || "-"}
                    </span>

                </td>

                <td class="price-text">

                    ${product.price.toLocaleString("vi-VN")}đ

                </td>

                <td>${product.quantity}</td>

                <td>${product.createdAt}</td>

                <td>

                    <div class="table-actions">

                        <button class="action-btn view-btn"
                                onclick="viewProduct('${product.id}')">

                            <i class='bx bx-show'></i>

                        </button>

                        <button class="action-btn edit-btn"
                                onclick="editProduct('${product.id}')">

                            <i class='bx bx-edit'></i>

                        </button>

                        ${product.status === "selling"

                ?

                `

                            <button class="action-btn stop-btn"
                                    onclick="stopSelling('${product.id}')">

                                <i class='bx bx-block'></i>

                            </button>

                            `

                :

                `

                            <button class="action-btn restore-btn"
                                    onclick="restoreProduct('${product.id}')">

                                <i class='bx bx-refresh'></i>

                            </button>

                            `
            }

                    </div>

                </td>

            </tr>

        `;

    });

    updateStats();

}

// =========================
// UPDATE STATS
// =========================

function updateStats() {

    document.getElementById("totalProduct").innerText =
        products.length;

    document.getElementById("sellingProduct").innerText =
        products.filter(product =>
            product.status === "selling"
        ).length;

    document.getElementById("stoppedProduct").innerText =
        products.filter(product =>
            product.status === "stopped"
        ).length;

    document.getElementById("lowStockProduct").innerText =
        products.filter(product =>
            product.quantity <= 5
        ).length;

}

// =========================
// FILTER
// =========================

function filterProducts() {

    let filtered = [...products];

    if (categoryFilter.value) {

        filtered = filtered.filter(product =>

            product.category === categoryFilter.value

        );

    }

    if (minPrice.value && maxPrice.value) {

        filtered = filtered.filter(product =>

            product.price >= Number(minPrice.value)

            &&

            product.price <= Number(maxPrice.value)

        );

    }

    renderProducts(filtered);

}

function setupPriceRange() {

    const prices = products.map(product => product.price);

    const lowestPrice = Math.min(...prices);

    const highestPrice = Math.max(...prices);

    minPrice.min = lowestPrice;

    minPrice.max = highestPrice;

    minPrice.value = lowestPrice;

    maxPrice.min = lowestPrice;

    maxPrice.max = highestPrice;

    maxPrice.value = highestPrice;

    updatePriceRangeText();

}

function updatePriceRangeText() {

    priceRangeText.innerText =
        `${Number(minPrice.value).toLocaleString("vi-VN")}đ - ${Number(maxPrice.value).toLocaleString("vi-VN")}đ`;

}

function handlePriceRangeInput(event) {

    if (Number(minPrice.value) > Number(maxPrice.value)) {

        if (event.target === minPrice) {

            maxPrice.value = minPrice.value;

        } else {

            minPrice.value = maxPrice.value;

        }

    }

    updatePriceRangeText();

    filterProducts();

}
// =========================
// FILTER EVENTS
// =========================

categoryFilter.addEventListener(
    "change",
    filterProducts
);

minPrice.addEventListener(
    "input",
    handlePriceRangeInput
);

maxPrice.addEventListener(
    "input",
    handlePriceRangeInput
);
// =========================
// MODAL
// =========================

function openModal() {

    modal.classList.add("show");

}

function closeModal() {

    modal.classList.remove("show");

}

openModalBtn.addEventListener("click", () => {

    currentEditId = null;

    modalTitle.innerText =
        "Thêm sản phẩm mới";

    clearForm();

    enableForm();

    saveProductBtn.style.display = "flex";

    openModal();

});

closeModalBtn.addEventListener(
    "click",
    closeModal
);

cancelModalBtn.addEventListener(
    "click",
    closeModal
);

modal.addEventListener("click", (e) => {

    if (e.target === modal) {

        closeModal();

    }

});

// =========================
// SAVE PRODUCT
// =========================

saveProductBtn.addEventListener("click", () => {

    const productData = {

        id:

            currentEditId ||

            `SP${Date.now()}`,

        name: productName.value.trim(),

        category: productCategory.value,

        size: productSize.value.trim(),

        color: productColor.value.trim(),

        price: Number(productPrice.value),

        quantity: Number(productQuantity.value),

        createdAt:

            productCreatedAt.value ||

            new Date()
                .toISOString()
                .split("T")[0],

        updatedAt:

            new Date()
                .toISOString()
                .split("T")[0],

        status: productStatus.value

    };

    // VALIDATE

    if (

        !productData.name ||

        !productData.category ||

        !productData.price

    ) {

        alert(
            "Vui lòng nhập đầy đủ thông tin bắt buộc"
        );

        return;

    }

    // ADD

    if (currentEditId === null) {

        products.push(productData);

    }

    // UPDATE

    else {

        const index = products.findIndex(product =>

            product.id === currentEditId

        );

        products[index] = {

            ...products[index],

            ...productData

        };

    }

    setupPriceRange();

    renderProducts();

    closeModal();

    clearForm();

});

// =========================
// VIEW PRODUCT
// =========================

function viewProduct(id) {

    const product = products.find(product =>

        product.id === id

    );

    fillForm(product);

    disableForm();

    saveProductBtn.style.display = "none";

    modalTitle.innerText =
        "Chi tiết sản phẩm";

    openModal();

}

// =========================
// EDIT PRODUCT
// =========================

function editProduct(id) {

    currentEditId = id;

    const product = products.find(product =>

        product.id === id

    );

    fillForm(product);

    enableForm();

    saveProductBtn.style.display = "flex";

    modalTitle.innerText =
        "Cập nhật sản phẩm";

    openModal();

}

// =========================
// STOP SELLING
// =========================

function stopSelling(id) {

    const confirmStop = confirm(
        "Bạn có muốn ngừng bán sản phẩm này?"
    );

    if (!confirmStop) return;

    const product = products.find(product =>

        product.id === id

    );

    product.status = "stopped";

    renderProducts();

}

// =========================
// RESTORE PRODUCT
// =========================

function restoreProduct(id) {

    const product = products.find(product =>

        product.id === id

    );

    product.status = "selling";

    renderProducts();

}

// =========================
// HELPERS
// =========================

function fillForm(product) {

    productName.value = product.name;

    productCategory.value = product.category;

    productSize.value = product.size;

    productColor.value = product.color;

    productPrice.value = product.price;

    productQuantity.value = product.quantity;

    productStatus.value = product.status;

    productCreatedAt.value = product.createdAt;

}

function clearForm() {

    productName.value = "";

    productCategory.value = "";

    productSize.value = "";

    productColor.value = "";

    productPrice.value = "";

    productQuantity.value = "";

    productStatus.value = "selling";

    productCreatedAt.value = getTodayDate();

}

function disableForm() {

    document.querySelectorAll(
        "#productModal input, #productModal select"
    ).forEach(input => {

        input.disabled = true;

    });

}

function enableForm() {

    document.querySelectorAll(
        "#productModal input, #productModal select"
    ).forEach(input => {

        input.disabled = false;

    });

}

// =========================
// INIT
// =========================

setupPriceRange();
renderProducts();