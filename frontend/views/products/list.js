// =========================
// SUBMENU
// =========================

const menuToggles = document.querySelectorAll(".menu-toggle");

menuToggles.forEach(toggle => {

    if (toggle.dataset.kidCityMenuBound === "true") return;

    toggle.dataset.kidCityMenuBound = "true";

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

const productSearch = document.getElementById("productSearch");



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
const productCategoryModal = document.getElementById("productCategoryModal");
const closeProductCategoryModalBtn = document.getElementById("closeProductCategoryModalBtn");
const cancelProductCategoryModalBtn = document.getElementById("cancelProductCategoryModalBtn");
const saveProductCategoryBtn = document.getElementById("saveProductCategoryBtn");
const newCategoryIdInput = document.getElementById("newCategoryId");
const newCategoryNameInput = document.getElementById("newCategoryName");
const newCategoryDescriptionInput = document.getElementById("newCategoryDescription");

const stopConfirmModal = document.getElementById("stopConfirmModal");

const closeStopConfirmBtn = document.getElementById("closeStopConfirmBtn");

const cancelStopBtn = document.getElementById("cancelStopBtn");

const confirmStopBtn = document.getElementById("confirmStopBtn");

const stopSuccessModal = document.getElementById("stopSuccessModal");

const closeStopSuccessBtn = document.getElementById("closeStopSuccessBtn");

const okStopSuccessBtn = document.getElementById("okStopSuccessBtn");

const stopSuccessMessage = document.getElementById("stopSuccessMessage");

let pendingStopProductId = null;
const isStaffRole = () => (localStorage.getItem("currentRole") || "").toLowerCase() === "staff";

// FORM

const productName = document.getElementById("productName");

const productImage = document.getElementById("productImage");

const productImagePreview = document.getElementById("productImagePreview");

const productImageFile = document.getElementById("productImageFile");

const productImageFileBtn = document.getElementById("productImageFileBtn");

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

function openProductCategoryModal() {

    if (!productCategoryModal) return;

    newCategoryIdInput.value = "";
    newCategoryNameInput.value = "";
    newCategoryDescriptionInput.value = "";
    productCategoryModal.classList.add("show");
    setTimeout(() => newCategoryIdInput?.focus(), 0);

}

function closeProductCategoryModal() {

    productCategoryModal?.classList.remove("show");

}

addCategoryBtn.addEventListener("click", openProductCategoryModal);

closeProductCategoryModalBtn?.addEventListener("click", closeProductCategoryModal);
cancelProductCategoryModalBtn?.addEventListener("click", closeProductCategoryModal);
productCategoryModal?.addEventListener("click", (event) => {

    if (event.target === productCategoryModal) {
        closeProductCategoryModal();
    }

});

saveProductCategoryBtn?.addEventListener("click", () => {

    const id = newCategoryIdInput.value.trim();
    const name = newCategoryNameInput.value.trim();
    const description = newCategoryDescriptionInput.value.trim();

    if (!id || !name || !description) {
        alert("Vui l\u00f2ng nh\u1eadp \u0111\u1ea7y \u0111\u1ee7 th\u00f4ng tin");
        return;
    }

    const existed = categories.find(category =>
        category.toLowerCase() === name.toLowerCase()
    );

    if (existed) {
        alert("Danh m\u1ee5c \u0111\u00e3 t\u1ed3n t\u1ea1i");
        productCategory.value = existed;
        updateAddProductCategoryGate();
        closeProductCategoryModal();
        return;
    }

    categories.push(name);
    loadCategories();
    productCategory.value = name;
    updateAddProductCategoryGate();
    closeProductCategoryModal();

});
function getVisibleProducts() {

    return products.filter(product =>

        product.status === "selling"

    );

}

// =========================
// RENDER PRODUCTS
// =========================

function svgProductImage(product) {
    const title = (product.name || "SP").slice(0, 22);
    const colorMap = { "Đỏ": "#ef4444", "Đỏ đô": "#991b1b", "Hồng": "#f472b6", "Vàng": "#facc15", "Đen": "#111827", "Trắng": "#f8fafc", "Xanh dương": "#2563eb", "Xanh nhạt": "#7dd3fc", "Xám": "#94a3b8", "Kem": "#fde68a" };
    const accent = colorMap[product.color] || "#60a5fa";
    const safeTitle = title.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect width="320" height="240" rx="28" fill="#eef4ff"/><path d="M104 72l38-24h36l38 24 28 38-32 20-18-24v82H126v-82l-18 24-32-20 28-38z" fill="${accent}"/><path d="M142 48c4 13 32 13 36 0" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="8" stroke-linecap="round"/><rect x="54" y="184" width="212" height="30" rx="15" fill="rgba(255,255,255,.9)"/><text x="160" y="205" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#0f172a">${safeTitle}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getProductImage(product) {
    return product.image || svgProductImage(product);
}

function updateProductImagePreview(product = {}) {
    if (!productImagePreview) return;
    const image = product.image || productImage?.value.trim() || svgProductImage({ name: productName?.value.trim() || product.name || "Sản phẩm", color: productColor?.value.trim() || product.color || "Xanh dương" });
    productImagePreview.innerHTML = `<img src="${image}" alt="Ảnh sản phẩm">`;
}
function renderProducts(data = getVisibleProducts()) {

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

                        <img src="${getProductImage(product)}"
                             alt="Ảnh sản phẩm"
                             onerror="this.src='${svgProductImage(product)}'">

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

                        ${isStaffRole() ? "" : product.status === "selling"

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

    let filtered = getVisibleProducts();

    const keyword = (productSearch?.value || "").trim().toLowerCase();

    if (keyword) {

        filtered = filtered.filter(product => {

            const searchable = [
                product.id,
                product.name,
                product.category,
                product.size,
                product.color,
                product.price,
                product.quantity,
                product.createdAt,
                product.updatedAt,
                product.status === "selling" ? "đang bán selling" : "ngừng bán stopped"
            ].join(" ").toLowerCase();

            return searchable.includes(keyword);

        });

    }

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

    const visibleProducts = getVisibleProducts();

    const rangeProducts =
        visibleProducts.length > 0 ? visibleProducts : products;

    const prices = rangeProducts.map(product => product.price);

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
if (productImage) {
    productImage.addEventListener("input", () => updateProductImagePreview());
}


if (productImageFileBtn && productImageFile) {
    productImageFileBtn.addEventListener("click", () => {
        if (productImageFileBtn.disabled) return;
        productImageFile.click();
    });

    productImageFile.addEventListener("change", () => {
        const file = productImageFile.files && productImageFile.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = event => {
            const imageData = event.target?.result || "";
            if (!imageData) return;
            if (productImage) productImage.value = imageData;
            updateProductImagePreview({ image: imageData });
        };
        reader.readAsDataURL(file);
    });
}

if (productName) {
    productName.addEventListener("input", () => updateProductImagePreview());
}

if (productColor) {
    productColor.addEventListener("input", () => updateProductImagePreview());
}

const addProductLockedFields = [
    productName,
    productImage,
    productImageFile,
    productImageFileBtn,
    productSize,
    productColor,
    productPrice,
    productQuantity,
    productStatus,
    productCreatedAt
].filter(Boolean);

function hasSelectedProductCategory() {
    return Boolean(productCategory?.value.trim());
}

function updateAddProductCategoryGate() {
    if (currentEditId !== null) return;

    const unlocked = hasSelectedProductCategory();

    addProductLockedFields.forEach(input => {
        input.disabled = !unlocked;
    });

    if (saveProductBtn) {
        saveProductBtn.disabled = !unlocked;
    }

    if (modal) {
        modal.classList.toggle("category-locked", !unlocked);
    }
}

if (productCategory) {
    productCategory.addEventListener("change", updateAddProductCategoryGate);
}
// FILTER EVENTS
// =========================

categoryFilter.addEventListener(
    "change",
    filterProducts
);

if (productSearch) {
    productSearch.addEventListener(
        "input",
        filterProducts
    );
}

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
    modal.classList.remove("category-locked");

}

openModalBtn.addEventListener("click", () => {

    currentEditId = null;

    modalTitle.innerText = "Thêm sản phẩm mới";

    clearForm();

    enableForm();

    saveProductBtn.style.display = "flex";

    showAddCategoryButton();

    updateAddProductCategoryGate();

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
closeStopConfirmBtn.addEventListener("click", closeStopConfirmModal);

cancelStopBtn.addEventListener("click", closeStopConfirmModal);

confirmStopBtn.addEventListener("click", confirmStopSelling);

closeStopSuccessBtn.addEventListener("click", closeStopSuccessModal);

okStopSuccessBtn.addEventListener("click", closeStopSuccessModal);

stopConfirmModal.addEventListener("click", (e) => {

    if (e.target === stopConfirmModal) {

        closeStopConfirmModal();

    }

});

stopSuccessModal.addEventListener("click", (e) => {

    if (e.target === stopSuccessModal) {

        closeStopSuccessModal();

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

        status: productStatus.value,

        image: productImage.value.trim()

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

    hideAddCategoryButton();

    modalTitle.innerText = "Chi tiết sản phẩm";

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

    hideAddCategoryButton();

    modalTitle.innerText = "Cập nhật sản phẩm";

    openModal();

}

// =========================
// STOP SELLING
// =========================

function stopSelling(id) {

    if (isStaffRole()) return;

    pendingStopProductId = id;

    stopConfirmModal.classList.add("show");

}

function closeStopConfirmModal() {

    pendingStopProductId = null;

    stopConfirmModal.classList.remove("show");

    filterProducts();

}

function confirmStopSelling() {

    if (isStaffRole()) return;

    if (!pendingStopProductId) return;

    const product = products.find(product =>

        product.id === pendingStopProductId

    );

    if (!product) return;

    product.status = "stopped";

    pendingStopProductId = null;

    stopConfirmModal.classList.remove("show");

    setupPriceRange();

    filterProducts();

    stopSuccessMessage.innerText =
        `B\u1ea1n \u0111\u00e3 ng\u1eebng kinh doanh s\u1ea3n ph\u1ea9m ${product.id} - ${product.name}`;

    stopSuccessModal.classList.add("show");

}

function closeStopSuccessModal() {

    stopSuccessModal.classList.remove("show");

}
// =========================
// RESTORE PRODUCT
// =========================

function restoreProduct(id) {

    if (isStaffRole()) return;

    const product = products.find(product =>

        product.id === id

    );

    product.status = "selling";

    setupPriceRange();

    filterProducts();

}

// =========================
// HELPERS
// =========================

function fillForm(product) {

    productName.value = product.name;

    productImage.value = product.image || "";

    updateProductImagePreview(product);

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

    productImage.value = "";

    if (productImageFile) productImageFile.value = "";

    productCategory.value = "";

    productSize.value = "";

    productColor.value = "";

    productPrice.value = "";

    productQuantity.value = "";

    productStatus.value = "selling";

    productCreatedAt.value = getTodayDate();

    updateProductImagePreview();

    if (currentEditId === null) {
        updateAddProductCategoryGate();
    }

}

function showAddCategoryButton() {

    addCategoryBtn.style.display = "flex";

}

function hideAddCategoryButton() {

    addCategoryBtn.style.display = "none";

}
function disableForm() {

    if (modal) {
        modal.classList.remove("category-locked");
    }
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

    if (saveProductBtn) {
        saveProductBtn.disabled = false;
    }

    if (modal) {
        modal.classList.remove("category-locked");
    }

}

async function loadProductsFromApi() {

    if (!window.kidCityApi) return;

    try {

        const [apiCategories, apiProducts] = await Promise.all([
            window.kidCityApi.get("products/categories.php"),
            window.kidCityApi.get("products/items.php")
        ]);

        if (Array.isArray(apiCategories)) {
            categories = apiCategories
                .map(category => category.name)
                .filter(Boolean);
            loadCategories();
        }

        if (Array.isArray(apiProducts)) {
            products = apiProducts.map(product => ({
                dbId: product.id,
                id: product.code || `SP${String(product.id || 0).padStart(3, "0")}`,
                name: product.name || "",
                category: product.category_name || "",
                categoryId: product.category_id || "",
                size: product.size || "",
                color: product.color || "",
                price: Number(product.price || 0),
                quantity: Number(product.stock || 0),
                createdAt: (product.created_at || "").slice(0, 10),
                updatedAt: (product.updated_at || product.created_at || "").slice(0, 10),
                status: (() => {
                    const rawStatus = String(product.status || "").toLowerCase();
                    return rawStatus.includes("stop") || rawStatus.includes("ng\u1eebng") || rawStatus.includes("ngung") ? "stopped" : "selling";
                })(),
                image: product.image || ""
            }));

            setupPriceRange();
            renderProducts();
        }

    } catch (error) {

        console.warn("Khong the tai san pham tu API:", error.message);
    }
}

// =========================
// INIT
// =========================

setupPriceRange();
renderProducts();
loadProductsFromApi();
