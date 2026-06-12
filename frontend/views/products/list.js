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

let categoryLookup = new Map();

let categories = [];

let products = [];

let currentEditId = null;
const pageSize = 6;
let currentPage = 1;
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

    return products;

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
function showProductsLoading() {

    if (table) {
        table.innerHTML = `<tr><td colspan="10" class="empty-data">Đang tải dữ liệu từ database...</td></tr>`;
    }

}
function sortProductsByStatus(data) {
    return [...data].sort((a, b) => {
        if (a.status === "selling" && b.status === "stopped") return -1;
        if (a.status === "stopped" && b.status === "selling") return 1;
        return 0;
    });
}

function renderProducts(data = getVisibleProducts()) {

    table.innerHTML = "";

    const sortedData = sortProductsByStatus(data);

    const totalPages = Math.max(
        1,
        Math.ceil(sortedData.length / pageSize)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * pageSize;

    const paginatedData = sortedData.slice(start, start + pageSize);

    if (paginatedData.length === 0) {
        table.innerHTML = `

            <tr>

                <td colspan="9" class="empty-data">

                    Không có sản phẩm nào

                </td>

            </tr>

        `;

        return;

    }

    paginatedData.forEach(product => {
        const isStopped = product.status === "stopped";
        const rowStyle = isStopped ? 'style="opacity: 0.5; background-color: #f9f9f9;"' : '';

        const editBtnHtml = isStopped ? "" : `
            <button class="action-btn edit-btn"
                    onclick="editProduct('${product.id}')" title="Sửa">
                <i class='bx bx-edit'></i>
            </button>
        `;

        const actionBtnHtml = isStaffRole() ? "" : (product.status === "selling"
            ? `
                <button class="action-btn stop-btn"
                        onclick="stopSelling('${product.id}')" title="Ngừng bán">
                    <i class='bx bx-block'></i>
                </button>
            `
            : `
                <button class="action-btn restore-btn"
                        onclick="restoreProduct('${product.id}')" title="Khôi phục">
                    <i class='bx bx-refresh'></i>
                </button>
            `
        );

        table.innerHTML += `

            <tr ${rowStyle}>

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

                <td>

                    <div class="table-actions">

                        <button class="action-btn view-btn"
                                onclick="viewProduct('${product.id}')" title="Xem chi tiết">

                            <i class='bx bx-show'></i>

                        </button>

                        ${editBtnHtml}

                        ${actionBtnHtml}

                    </div>

                </td>

            </tr>

        `;

    });

    updateStats();
    renderPagination(data.length);

}
function renderPagination(totalItems) {

    const pagination =
        document.getElementById("productPagination");

    if (!pagination) return;

    const totalPages = Math.max(
        1,
        Math.ceil(totalItems / pageSize)
    );

    if (totalItems === 0) {
        pagination.innerHTML = "";
        return;
    }

    let buttons = "";

    for (let i = 1; i <= totalPages; i++) {

        buttons += `
            <button
                class="page-btn ${i === currentPage ? "active" : ""}"
                data-page="${i}">
                ${i}
            </button>
        `;
    }

    pagination.innerHTML = `
        <button
            class="page-btn"
            data-page="prev"
            ${currentPage === 1 ? "disabled" : ""}>
            ‹
        </button>

        ${buttons}

        <button
            class="page-btn"
            data-page="next"
            ${currentPage === totalPages ? "disabled" : ""}>
            ›
        </button>
    `;
}

// =========================
// UPDATE STATS
// =========================

function updateStats() {
    // Stats cards are removed from HTML, do nothing
}

// =========================
// FILTER
// =========================
function getFilteredProducts() {

    let filtered = getVisibleProducts();

    const keyword =
        (productSearch?.value || "")
        .trim()
        .toLowerCase();

    if (keyword) {

        filtered = filtered.filter(product => {

            const searchable = [
                product.id,
                product.name,
                product.category,
                product.size,
                product.color
            ]
            .join(" ")
            .toLowerCase();

            return searchable.includes(keyword);

        });
    }

    if (categoryFilter.value) {

        filtered = filtered.filter(
            product =>
                product.category === categoryFilter.value
        );
    }

    if (minPrice.value && maxPrice.value) {

        filtered = filtered.filter(
            product =>
                product.price >= Number(minPrice.value)
                &&
                product.price <= Number(maxPrice.value)
        );
    }

    return filtered;
}

function filterProducts() {

    currentPage = 1;

    renderProducts(
        getFilteredProducts()
    );

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
document.getElementById("productPagination")
?.addEventListener("click", event => {

    const btn = event.target.closest(".page-btn");

    if (!btn || btn.disabled) return;

    const filtered = getFilteredProducts();

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / pageSize)
    );

    if (btn.dataset.page === "prev") {

        currentPage =
            Math.max(1, currentPage - 1);

    } else if (btn.dataset.page === "next") {

        currentPage =
            Math.min(totalPages, currentPage + 1);

    } else {

        currentPage =
            Number(btn.dataset.page);
    }

    renderProducts(filtered);

});
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

if (openModalBtn) {
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
}

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

saveProductBtn.addEventListener("click", async () => {

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
    if (window.kidCityApi) {
        const existingProduct = currentEditId === null
            ? null
            : products.find(product => product.id === currentEditId);
        const payload = {
            id: existingProduct?.dbId,
            code: productData.id,
            category_id: categoryLookup.get(productData.category) || existingProduct?.categoryId || null,
            name: productData.name,
            size: productData.size,
            color: productData.color,
            price: productData.price,
            stock: productData.quantity,
            image: productData.image,
            status: productData.status === "stopped" ? "Ng\u1eebng b\u00e1n" : "\u0110ang b\u00e1n"
        };

        try {
            if (currentEditId === null) {
                await window.kidCityApi.post("products/items.php", payload);
            } else {
                await window.kidCityApi.put("products/items.php", payload);
            }
            await loadProductsFromApi();
            closeModal();
            clearForm();
            return;
        } catch (error) {
            alert(error.message || "Kh\u00f4ng th\u1ec3 l\u01b0u s\u1ea3n ph\u1ea9m v\u00e0o database.");
            return;
        }
    }

    if (currentEditId === null) {

        products.push(productData);

    } else {

        const index = products.findIndex(product => product.id === currentEditId);
        if (index >= 0) products[index] = { ...products[index], ...productData };

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

    // Show ID, Created At, Updated At groups
    document.getElementById("productIdGroup").style.display = "block";
    document.getElementById("productCreatedAtGroup").style.display = "block";
    document.getElementById("productUpdatedAtGroup").style.display = "block";

    openModal();

}

// =========================
// EDIT PRODUCT
// =========================

function editProduct(id) {

    const product = products.find(product =>

        product.id === id

    );

    if (!product || product.status === "stopped") {
        return;
    }

    currentEditId = id;

    fillForm(product);

    enableForm();

    // Disable code, createdAt, updatedAt
    document.getElementById("productId").disabled = true;
    document.getElementById("productCreatedAt").disabled = true;
    document.getElementById("productUpdatedAt").disabled = true;

    saveProductBtn.style.display = "flex";

    hideAddCategoryButton();

    modalTitle.innerText = "Cập nhật sản phẩm";

    // Show groups
    document.getElementById("productIdGroup").style.display = "block";
    document.getElementById("productCreatedAtGroup").style.display = "block";
    document.getElementById("productUpdatedAtGroup").style.display = "block";

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

async function confirmStopSelling() {

    if (isStaffRole()) return;

    if (!pendingStopProductId) return;

    const product = products.find(product =>

        product.id === pendingStopProductId

    );

    if (!product) return;

    if (window.kidCityApi) {
        try {
            const payload = {
                id: product.dbId,
                code: product.id,
                category_id: product.categoryId || null,
                name: product.name,
                size: product.size,
                color: product.color,
                price: product.price,
                stock: product.quantity,
                image: product.image,
                status: "Ngừng bán"
            };
            await window.kidCityApi.put("products/items.php", payload);
            product.status = "stopped";
            pendingStopProductId = null;
            stopConfirmModal.classList.remove("show");
            setupPriceRange();
            filterProducts();
            stopSuccessMessage.innerText = `Bạn đã ngừng kinh doanh sản phẩm ${product.id} - ${product.name}`;
            stopSuccessModal.classList.add("show");
        } catch (error) {
            alert(error.message || "Không thể ngừng bán sản phẩm.");
        }
    } else {
        product.status = "stopped";
        pendingStopProductId = null;
        stopConfirmModal.classList.remove("show");
        setupPriceRange();
        filterProducts();
        stopSuccessMessage.innerText =
            `B\u1ea1n \u0111\u00e3 ng\u1eebng kinh doanh s\u1ea3n ph\u1ea9m ${product.id} - ${product.name}`;
        stopSuccessModal.classList.add("show");
    }

}

function closeStopSuccessModal() {

    stopSuccessModal.classList.remove("show");

}
// =========================
// RESTORE PRODUCT
// =========================

async function restoreProduct(id) {

    if (isStaffRole()) return;

    const product = products.find(product =>

        product.id === id

    );

    if (!product) return;

    if (window.kidCityApi) {
        try {
            const payload = {
                id: product.dbId,
                code: product.id,
                category_id: product.categoryId || null,
                name: product.name,
                size: product.size,
                color: product.color,
                price: product.price,
                stock: product.quantity,
                image: product.image,
                status: "Đang bán"
            };
            await window.kidCityApi.put("products/items.php", payload);
            product.status = "selling";
            setupPriceRange();
            filterProducts();
            if (window.showToast) {
                window.showToast("Khôi phục sản phẩm thành công!");
            } else {
                alert("Khôi phục sản phẩm thành công!");
            }
        } catch (error) {
            alert(error.message || "Không thể khôi phục sản phẩm.");
        }
    } else {
        product.status = "selling";
        setupPriceRange();
        filterProducts();
    }

}

// =========================
// HELPERS
// =========================

function fillForm(product) {

    document.getElementById("productId").value = product.id;

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

    document.getElementById("productUpdatedAt").value = product.updatedAt;

}

function clearForm() {

    document.getElementById("productId").value = "";

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

    document.getElementById("productUpdatedAt").value = "";

    updateProductImagePreview();

    if (currentEditId === null) {
        updateAddProductCategoryGate();
    }

    // Hide ID, Created At, Updated At groups
    document.getElementById("productIdGroup").style.display = "none";
    document.getElementById("productCreatedAtGroup").style.display = "none";
    document.getElementById("productUpdatedAtGroup").style.display = "none";

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
            categoryLookup = new Map(apiCategories
                .filter(category => category.name)
                .map(category => [category.name, category.id]));
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

showProductsLoading();
loadProductsFromApi();
