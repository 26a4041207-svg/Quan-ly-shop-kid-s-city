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
// STATE
// =========================
let categories = [];
let currentEditId = null;
const pageSize = 6;
let currentPage = 1;

const isStaffRole = () => (localStorage.getItem("currentRole") || "").toLowerCase() === "staff";

// =========================
// ELEMENTS
// =========================
const table = document.getElementById("categoryTable");
const searchInput = document.getElementById("searchCategory");
const modal = document.getElementById("categoryModal");
const modalTitle = document.getElementById("modalTitle");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");

// Form inputs
const categoryIdGroup = document.getElementById("categoryIdGroup");
const categoryId = document.getElementById("categoryId");
const categoryName = document.getElementById("categoryName");
const categoryDescription = document.getElementById("categoryDescription");
const categoryUpdatedGroup = document.getElementById("categoryUpdatedGroup");
const categoryUpdated = document.getElementById("categoryUpdated");

// Hide add category button if user is staff
if (isStaffRole()) {
    if (openModalBtn) openModalBtn.style.display = "none";
}

// =========================
// HELPERS
// =========================
function formatDate(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' });
}

// =========================
// RENDER TABLE
// =========================
function renderCategories(data = getFilteredCategories()) {
    if (!table) return;
    table.innerHTML = "";

    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * pageSize;
    const paginatedData = data.slice(start, start + pageSize);

    if (paginatedData.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty-data" style="text-align: center; padding: 30px; color: #999;">
                    Không có danh mục nào
                </td>
            </tr>
        `;
        renderPagination(0);
        return;
    }

    paginatedData.forEach(category => {
        const actionHtml = isStaffRole() ? "-" : `
            <div class="table-actions">
                <button class="action-btn edit-btn" onclick="editCategory(${category.id})">
                    <i class='bx bx-edit'></i>
                </button>
            </div>
        `;

        table.innerHTML += `
            <tr>
                <td><strong>${category.code || "-"}</strong></td>
                <td class="font-weight-600">${category.name || ""}</td>
                <td>${category.description || "-"}</td>
                <td>${formatDate(category.created_at)}</td>
                <td>${formatDate(category.updated_at || category.created_at)}</td>
                <td>${actionHtml}</td>
            </tr>
        `;
    });

    renderPagination(data.length);
}

// =========================
// PAGINATION
// =========================
function renderPagination(totalItems) {
    const pagination = document.getElementById("categoryPagination");
    if (!pagination) return;
    
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    
    if (totalItems === 0) {
        pagination.innerHTML = "";
        return;
    }

    let buttons = "";
    for (let i = 1; i <= totalPages; i++) {
        const activeClass = i === currentPage ? "active" : "";
        buttons += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }

    pagination.innerHTML = `
        <button class="page-btn" data-page="prev" ${currentPage === 1 ? "disabled" : ""}>‹</button>
        ${buttons}
        <button class="page-btn" data-page="next" ${currentPage === totalPages ? "disabled" : ""}>›</button>
    `;
}

// =========================
// FILTER / SEARCH
// =========================
function getFilteredCategories() {
    const keyword = (searchInput?.value || "").trim().toLowerCase();
    if (!keyword) return categories;

    return categories.filter(category => {
        const searchable = [
            category.code,
            category.name,
            category.description
        ].join(" ").toLowerCase();
        return searchable.includes(keyword);
    });
}

function filterCategories() {
    currentPage = 1;
    renderCategories();
}

if (searchInput) {
    searchInput.addEventListener("input", filterCategories);
}

// Bind pagination click events
document.getElementById("categoryPagination")?.addEventListener("click", event => {
    const btn = event.target.closest(".page-btn");
    if (!btn || btn.disabled) return;

    const filtered = getFilteredCategories();
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    if (btn.dataset.page === "prev") {
        currentPage = Math.max(1, currentPage - 1);
    } else if (btn.dataset.page === "next") {
        currentPage = Math.min(totalPages, currentPage + 1);
    } else {
        currentPage = Number(btn.dataset.page);
    }

    renderCategories(filtered);
});

// =========================
// MODAL INTERACTIONS
// =========================
function openModal() {
    modal?.classList.add("show");
}

function closeModal() {
    modal?.classList.remove("show");
    clearForm();
}

if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
        currentEditId = null;
        if (modalTitle) modalTitle.innerText = "Thêm danh mục mới";
        if (categoryIdGroup) categoryIdGroup.style.display = "none";
        if (categoryUpdatedGroup) categoryUpdatedGroup.style.display = "none";
        clearForm();
        openModal();
    });
}

closeModalBtn?.addEventListener("click", closeModal);
cancelModalBtn?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
});

// =========================
// SAVE / SUBMIT
// =========================
saveCategoryBtn?.addEventListener("click", async () => {
    const name = categoryName.value.trim();
    const description = categoryDescription.value.trim();

    if (!name) {
        alert("Vui lòng nhập tên danh mục");
        categoryName.focus();
        return;
    }

    const payload = {
        name,
        description,
        status: "Đang bán"
    };

    if (currentEditId !== null) {
        payload.id = currentEditId;
        payload.code = categoryId.value.trim();
    }

    if (window.kidCityApi) {
        try {
            if (currentEditId === null) {
                await window.kidCityApi.post("products/categories.php", payload);
            } else {
                await window.kidCityApi.put("products/categories.php", payload);
            }
            await loadCategoriesFromApi();
            closeModal();
            if (window.showToast) {
                window.showToast(currentEditId === null ? "Thêm danh mục thành công!" : "Cập nhật danh mục thành công!");
            }
        } catch (error) {
            alert(error.message || "Không thể lưu danh mục vào database.");
        }
    } else {
        alert("Chế độ Offline: Không thể lưu danh mục.");
    }
});

// =========================
// EDIT / DELETE
// =========================
window.editCategory = function(id) {
    if (isStaffRole()) return;
    currentEditId = id;
    const category = categories.find(c => c.id === id);
    if (!category) return;

    if (modalTitle) modalTitle.innerText = "Cập nhật danh mục";
    
    // Populate form
    categoryId.value = category.code || "";
    categoryName.value = category.name || "";
    categoryDescription.value = category.description || "";
    
    if (categoryUpdated) {
        const datePart = (category.updated_at || category.created_at || "").slice(0, 10);
        categoryUpdated.value = datePart;
    }

    // Show/hide groups
    if (categoryIdGroup) categoryIdGroup.style.display = "block";
    if (categoryUpdatedGroup) categoryUpdatedGroup.style.display = "block";

    openModal();
};

window.deleteCategory = async function(id) {
    if (isStaffRole()) return;
    const category = categories.find(c => c.id === id);
    if (!category) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`)) {
        return;
    }

    if (window.kidCityApi) {
        try {
            await window.kidCityApi.delete(`products/categories.php?id=${id}`);
            await loadCategoriesFromApi();
            if (window.showToast) {
                window.showToast("Xóa danh mục thành công!");
            }
        } catch (error) {
            alert(error.message || "Không thể xóa danh mục.");
        }
    } else {
        alert("Chế độ Offline: Không thể xóa danh mục.");
    }
};

// =========================
// HELPERS
// =========================
function clearForm() {
    if (categoryId) categoryId.value = "";
    if (categoryName) categoryName.value = "";
    if (categoryDescription) categoryDescription.value = "";
    if (categoryUpdated) categoryUpdated.value = "";
}

// =========================
// LOAD DATA
// =========================
async function loadCategoriesFromApi() {
    if (!window.kidCityApi) return;
    try {
        const data = await window.kidCityApi.get("products/categories.php");
        if (Array.isArray(data)) {
            categories = data;
            renderCategories();
        }
    } catch (error) {
        console.warn("Không thể tải danh mục từ API:", error.message);
    }
}

// Initialize
loadCategoriesFromApi();
