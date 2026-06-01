// SUBMENU

const menuToggles = document.querySelectorAll(".menu-toggle");

menuToggles.forEach(toggle => {

    if (toggle.dataset.kidCityMenuBound === "true") return;

    toggle.dataset.kidCityMenuBound = "true";

    toggle.addEventListener("click", (e) => {

        e.preventDefault();

        toggle.parentElement.classList.toggle("open");

    });

});

// DATA

let categories = [

    {
        id: "DM001",
        name: "Áo thun trẻ em",
        description: "Các loại áo cotton cho bé từ 1-10 tuổi",
        createdAt: "2026-05-01"
    },

    {
        id: "DM002",
        name: "Quần short",
        description: "Quần short jean mùa hè",
        createdAt: "2026-05-08"
    },

    {
        id: "DM003",
        name: "Váy bé gái",
        description: "Váy hoa cho bé gái",
        createdAt: "2026-05-10"
    },
    {
        id: "DM004",
        name: "Quần dài bé trai",
        description: "Quần dài cotton cho bé trai",
        createdAt: "2026-05-14"
    },
    {
        id: "DM005",
        name: "Áo khoác mùa đông",
        description: "Áo khoác chống lạnh cho bé",
        createdAt: "2026-05-15 "
    },
    {
        id: "DM006",
        name: "Tất chân trẻ em",
        description: "Tất chân cotton cho bé ",
        createdAt: "2026-05-10"
    }

];

let currentEditId = null;

// ELEMENTS

const tableBody = document.getElementById("categoryTable");

const searchInput = document.getElementById("searchCategory");
const modal = document.getElementById("categoryModal");

const openModalBtn = document.getElementById("openModalBtn");

const closeModalBtn = document.getElementById("closeModalBtn");

const cancelModalBtn = document.getElementById("cancelModalBtn");

const saveBtn = document.getElementById("saveCategoryBtn");

const modalTitle = document.getElementById("modalTitle");

const categoryIdInput = document.getElementById("categoryId");

const categoryNameInput = document.getElementById("categoryName");

const categoryDescriptionInput =
    document.getElementById("categoryDescription");

// RENDER

function renderTable(data = categories) {

    tableBody.innerHTML = "";

    data.forEach(category => {

        tableBody.innerHTML += `

            <tr>

                <td>${category.id}</td>

                <td class="font-weight-600">
                    ${category.name}
                </td>

                <td>
                    ${category.description}
                </td>

                <td>
                    ${category.createdAt}
                </td>

                <td>

                    <div class="table-actions">

                        <button
                            class="action-btn view-btn"
                            onclick="viewCategory('${category.id}')">

                            <i class='bx bx-show'></i>

                        </button>

                        <button
                            class="action-btn edit-btn"
                            onclick="editCategory('${category.id}')">

                            <i class='bx bx-edit'></i>

                        </button>

                    </div>

                </td>

            </tr>

        `;

    });

    updateStats();

}

// STATS

function updateStats() {

    document.getElementById("totalCategory").innerText =
        categories.length;

    const today =
        new Date().toISOString().split("T")[0];

    const thisMonth =
        today.slice(0, 7);

    const todayCount = categories.filter(c =>
        c.createdAt === today
    ).length;

    const monthCount = categories.filter(c =>
        c.createdAt.startsWith(thisMonth)
    ).length;

    document.getElementById("todayCategory").innerText =
        todayCount;

    document.getElementById("monthCategory").innerText =
        monthCount;

    document.getElementById("newCategory").innerText =
        2;

}

// SEARCH

searchInput.addEventListener("keyup", searchCategories);

function searchCategories() {

    const keyword = searchInput.value.toLowerCase();

    const filtered = categories.filter(category =>

        category.id.toLowerCase().includes(keyword)

        ||

        category.name.toLowerCase().includes(keyword)

        ||

        category.description.toLowerCase().includes(keyword)

    );

    renderTable(filtered);

}
// MODAL

openModalBtn.addEventListener("click", () => {

    currentEditId = null;

    modalTitle.innerText = "Thêm danh mục";

    saveBtn.style.display = "flex";

    enableInputs();

    clearForm();

    modal.classList.add("show");

});

function closeModal() {

    modal.classList.remove("show");

}

closeModalBtn.addEventListener("click", closeModal);

cancelModalBtn.addEventListener("click", closeModal);

modal.addEventListener("click", (e) => {

    if (e.target === modal) {

        closeModal();

    }

});

// SAVE

saveBtn.addEventListener("click", () => {

    const id =
        categoryIdInput.value.trim();

    const name =
        categoryNameInput.value.trim();

    const description =
        categoryDescriptionInput.value.trim();

    if (!id || !name || !description) {

        alert("Vui lòng nhập đầy đủ thông tin");

        return;

    }

    // ADD
    if (currentEditId === null) {

        categories.push({

            id,
            name,
            description,

            createdAt:
                new Date()
                .toISOString()
                .split("T")[0]

        });

    }

    // EDIT
    else {

        const category =
            categories.find(c => c.id === currentEditId);

        category.id = id;

        category.name = name;

        category.description = description;

    }

    renderTable();

    closeModal();

});

// VIEW

function viewCategory(id) {

    const category =
        categories.find(c => c.id === id);

    modalTitle.innerText =
        "Chi tiết danh mục";

    categoryIdInput.value =
        category.id;

    categoryNameInput.value =
        category.name;

    categoryDescriptionInput.value =
        category.description;

    disableInputs();

    saveBtn.style.display = "none";

    modal.classList.add("show");

}

// EDIT

function editCategory(id) {

    const category =
        categories.find(c => c.id === id);

    currentEditId = id;

    modalTitle.innerText =
        "Cập nhật danh mục";

    categoryIdInput.value =
        category.id;

    categoryNameInput.value =
        category.name;

    categoryDescriptionInput.value =
        category.description;

    enableInputs();

    saveBtn.style.display = "flex";

    modal.classList.add("show");

}

// HELPERS

function clearForm() {

    categoryIdInput.value = "";

    categoryNameInput.value = "";

    categoryDescriptionInput.value = "";

}

function disableInputs() {

    categoryIdInput.disabled = true;

    categoryNameInput.disabled = true;

    categoryDescriptionInput.disabled = true;

}

function enableInputs() {

    categoryIdInput.disabled = false;

    categoryNameInput.disabled = false;

    categoryDescriptionInput.disabled = false;

}

async function loadCategoriesFromApi() {

    if (!window.kidCityApi) return;

    try {

        const rows = await window.kidCityApi.get("products/categories.php");

        if (!Array.isArray(rows)) return;

        categories = rows.map((item, index) => ({
            dbId: item.id,
            id: item.code || `DM${String(index + 1).padStart(3, "0")}`,
            name: item.name || "",
            description: item.description || "",
            createdAt: (item.created_at || "").slice(0, 10)
        }));

        renderTable();

    } catch (error) {

        console.warn("Khong the tai danh muc tu API:", error.message);
    }
}

// INIT

renderTable();
loadCategoriesFromApi();
