window.initImportPage = function initImportPage(container) {
    const root = container.querySelector('#import-page');
    if (!root || root.dataset.importReady === 'true') return;
    root.dataset.importReady = 'true';

    /* =====================================================
       IMPORT DATA - Dữ liệu mẫu để tính tiền hàng nhập
       ===================================================== */
    const prices = {
        'Áo thun Mickey Mouse': 80000,
        'Áo thun Elsa Frozen': 90000,
        'Áo thun Spider-Man': 95000,
        'Váy hoa nhí công chúa': 150000
    };
    const productCatalog = {
        'Áo thun Mickey Mouse': { category: 'Áo bé trai', size: 'M', color: 'Đỏ', quantity: 100, image: '' },
        'Áo thun Elsa Frozen': { category: 'Áo bé gái', size: 'S', color: 'Xanh', quantity: 80, image: '' },
        'Áo thun Spider-Man': { category: 'Áo bé trai', size: 'L', color: 'Đen', quantity: 120, image: '' },
        'Váy hoa nhí công chúa': { category: 'Đầm váy', size: 'S', color: 'Hồng', quantity: 60, image: '' }
    };
    const defaultProducts = [
        { product: 'Áo thun Mickey Mouse', category: 'Áo bé trai', size: 'M', color: 'Đỏ', quantity: 100, image: '' },
        { product: 'Áo thun Elsa Frozen', category: 'Áo bé gái', size: 'S', color: 'Xanh', quantity: 80, image: '' },
        { product: 'Áo thun Spider-Man', category: 'Áo bé trai', size: 'L', color: 'Đen', quantity: 120, image: '' }
    ];

    /* =====================================================
       IMPORT HELPERS - Hàm tiện ích dùng chung
       ===================================================== */
    const pageSize = 6;
    const storageKey = 'kidscity_import_receipts';
    let currentPage = 1;
    const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
    const normalize = (text) => (text || '').trim().toLowerCase();
    const validSelect = (select) => select && select.value && !select.value.includes('--');
    const rowText = (row, index) => row.children[index]?.textContent.trim() || '';
    const getProducts = (row) => {
        try { return JSON.parse(row.dataset.products || '[]'); }
        catch { return []; }
    };
    const searchableImportRow = (row) => {
        const products = getProducts(row)
            .map((item) => `${item.product || ''} ${item.category || ''} ${item.size || ''} ${item.color || ''} ${item.quantity || ''}`)
            .join(' ');
        return normalize(`${row.dataset.key || ''} ${row.dataset.supplier || ''} ${row.textContent || ''} ${products}`);
    };
    const setProducts = (row, products) => {
        row.dataset.products = JSON.stringify(products);
    };
    const productRowsHtml = (products, includePrice = false) => {
        if (!products.length) return '<tr><td colspan="5" class="empty-row">Chưa có sản phẩm.</td></tr>';
        return products.map((item, index) => {
            if (includePrice) {
                const total = Number(item.price || 0) * Number(item.quantity || 0);
                return `<tr><td>${index + 1}</td><td>${item.product}</td><td>${item.quantity}</td><td>${formatMoney(item.price)}</td><td><strong>${formatMoney(total)}</strong></td></tr>`;
            }
            return `<tr><td>${item.product || ''}</td><td>${item.category || '-'}</td><td>${item.size || '-'}</td><td>${item.color || '-'}</td><td><strong>${item.quantity || 0}</strong></td></tr>`;
        }).join('');
    };

    const collectImportRecords = () => Array.from(root.querySelectorAll('#import-table tr')).map((row) => ({
        code: rowText(row, 0),
        date: rowText(row, 1),
        staff: rowText(row, 2),
        supplier: row.dataset.supplier || '',
        products: getProducts(row)
    }));

    const saveImports = () => {
        localStorage.setItem(storageKey, JSON.stringify(collectImportRecords()));
    };

    /* =====================================================
       IMPORT MODAL - Mở/đóng popup
       ===================================================== */
    const openModal = (id) => root.querySelector('#' + id)?.classList.add('active');
    const closeModal = (modal) => modal?.classList.remove('active');

    root.addEventListener('click', (event) => {
        const openBtn = event.target.closest('[data-import-open]');
        if (openBtn && root.contains(openBtn)) {
            openModal(openBtn.dataset.importOpen);
            return;
        }

        const closeBtn = event.target.closest('[data-import-close]');
        if (closeBtn && root.contains(closeBtn)) {
            closeModal(closeBtn.closest('.import-modal'));
            return;
        }

        const viewBtn = event.target.closest('[data-import-view]');
        if (viewBtn && root.contains(viewBtn)) {
            showImportDetail(viewBtn.closest('tr'));
            return;
        }

        const editBtn = event.target.closest('[data-import-edit]');
        if (editBtn && root.contains(editBtn)) {
            openImportEdit(editBtn.closest('tr'));
            return;
        }

        const draftEditBtn = event.target.closest('[data-import-draft-edit]');
        if (draftEditBtn && root.contains(draftEditBtn)) {
            openDraftProductEdit(draftEditBtn.closest('tr'));
            return;
        }

        const draftDeleteBtn = event.target.closest('[data-import-draft-delete]');
        if (draftDeleteBtn && root.contains(draftDeleteBtn)) {
            deleteDraftProduct(draftDeleteBtn.closest('tr'));
        }
    });

    root.querySelectorAll('.import-modal').forEach((modal) => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal(modal);
        });
    });

    /* =====================================================
       IMPORT ACTIONS - Gắn nút xem/sửa và dữ liệu mặc định
       ===================================================== */
    const attachActions = (row) => {
        row.lastElementChild.innerHTML = `
            <div class="import-action-group">
                <button class="import-action-btn view" data-import-view title="Xem chi tiết"><i class='bx bx-show'></i></button>
                <button class="import-action-btn edit" data-import-edit title="Sửa"><i class='bx bx-edit-alt'></i></button>
            </div>
        `;
    };

    const restoreImports = () => {
        const saved = localStorage.getItem(storageKey);
        if (!saved) return;

        let records = [];
        try { records = JSON.parse(saved); }
        catch { records = []; }
        if (!records.length) return;

        const body = root.querySelector('#import-table');
        body.innerHTML = '';
        records.forEach((item) => {
            const row = document.createElement('tr');
            row.dataset.key = normalize(`${item.code} ${item.date} ${item.staff} ${item.supplier || ''}`);
            row.dataset.supplier = item.supplier || '';
            setProducts(row, item.products || []);
            row.innerHTML = `<td><strong>${item.code}</strong></td><td>${item.date}</td><td>${item.staff}</td><td></td>`;
            body.appendChild(row);
        });
        root.querySelector('.import-stat strong').textContent = String(records.length);
    };

    restoreImports();
    root.querySelectorAll('#import-table tr').forEach((row) => {
        if (!row.dataset.products) setProducts(row, defaultProducts);
        attachActions(row);
    });

    const mapImportProductsFromApi = (items = []) => items.map((item) => ({
        product: item.product_name || item.product_code || '',
        category: item.category_name || '-',
        size: item.size || '-',
        color: item.color || '-',
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        image: item.image || ''
    }));

    const loadImportsFromApi = async () => {
        if (!window.kidCityApi) return;
        try {
            const receipts = await window.kidCityApi.get('imports/index.php');
            if (!Array.isArray(receipts)) return;
            const body = root.querySelector('#import-table');
            body.innerHTML = '';
            receipts.forEach((receipt) => {
                const row = document.createElement('tr');
                const products = mapImportProductsFromApi(receipt.items || []);
                row.dataset.key = normalize(`${receipt.code || ''} ${receipt.import_date || ''} ${receipt.staff_name || ''} ${receipt.supplier || ''}`);
                row.dataset.supplier = receipt.supplier || '';
                setProducts(row, products);
                row.innerHTML = `<td><strong>${receipt.code || ''}</strong></td><td>${receipt.import_date || ''}</td><td>${receipt.staff_name || ''}</td><td></td>`;
                attachActions(row);
                body.appendChild(row);
            });
            root.querySelector('.import-stat strong').textContent = String(receipts.length);
            currentPage = 1;
            renderPagination();
        } catch (error) {
            console.warn('Khong the tai phieu nhap tu API:', error.message);
        }
    };

    const loadImportCatalogFromApi = async () => {
        if (!window.kidCityApi) return;
        try {
            const [categories, products] = await Promise.all([
                window.kidCityApi.get('products/categories.php'),
                window.kidCityApi.get('products/items.php')
            ]);

            const categorySelect = root.querySelector('[data-import-category]');
            if (categorySelect && Array.isArray(categories)) {
                categorySelect.innerHTML = '<option value="">Chọn danh mục</option>';
                categories.forEach((category) => {
                    const option = document.createElement('option');
                    option.value = category.name || '';
                    option.textContent = category.name || '';
                    categorySelect.appendChild(option);
                });
            }

            const datalist = root.querySelector('#import-product-options');
            if (datalist && Array.isArray(products)) {
                datalist.innerHTML = '';
                Object.keys(productCatalog).forEach((key) => delete productCatalog[key]);
                products.forEach((product) => {
                    if (!product.name) return;
                    productCatalog[product.name] = {
                        productId: product.id,
                        category: product.category_name || '',
                        size: product.size || '',
                        color: product.color || '',
                        quantity: 1,
                        image: product.image || '',
                        price: Number(product.import_price || product.price || 0)
                    };
                    const option = document.createElement('option');
                    option.value = product.name;
                    datalist.appendChild(option);
                });
            }
        } catch (error) {
            console.warn('Khong the tai danh muc/san pham nhap tu API:', error.message);
        }
    };

    /* =====================================================
       IMPORT PAGINATION - Mỗi trang hiển thị 6 phiếu hàng nhập
       ===================================================== */
    const filteredRows = () => {
        const keyword = normalize(root.querySelector('#import-search').value);
        return Array.from(root.querySelectorAll('#import-table tr')).filter((row) => searchableImportRow(row).includes(keyword));
    };

    const renderPagination = () => {
        const rows = Array.from(root.querySelectorAll('#import-table tr'));
        const rowsFiltered = filteredRows();
        const totalPages = Math.max(1, Math.ceil(rowsFiltered.length / pageSize));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * pageSize;
        const visible = new Set(rowsFiltered.slice(start, start + pageSize));
        rows.forEach((row) => {
            row.style.display = visible.has(row) ? '' : 'none';
        });

        const pagination = root.querySelector('#import-pagination');
        if (!pagination) return;
        if (!rowsFiltered.length) {
            pagination.innerHTML = '';
            return;
        }

        const buttons = Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            const active = page === currentPage ? ' active' : '';
            return `<button class="import-page-btn${active}" data-import-page="${page}">${page}</button>`;
        }).join('');
        pagination.innerHTML = `<button class="import-page-btn" data-import-page="prev" ${currentPage === 1 ? 'disabled' : ''}>‹</button>${buttons}<button class="import-page-btn" data-import-page="next" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    };

    root.querySelector('#import-pagination')?.addEventListener('click', (event) => {
        const btn = event.target.closest('.import-page-btn');
        if (!btn || btn.disabled) return;
        const totalPages = Math.max(1, Math.ceil(filteredRows().length / pageSize));
        if (btn.dataset.importPage === 'prev') currentPage = Math.max(1, currentPage - 1);
        else if (btn.dataset.importPage === 'next') currentPage = Math.min(totalPages, currentPage + 1);
        else currentPage = Number(btn.dataset.importPage);
        renderPagination();
    });

    /* =====================================================
       IMPORT SEARCH - Tìm kiếm phiếu hàng nhập theo mã/ngày/người tạo phiếu
       ===================================================== */
    root.querySelector('#import-search').addEventListener('input', () => {
        currentPage = 1;
        renderPagination();
    });

    /* =====================================================
       IMPORT CREATE - Thêm sản phẩm và tạo phiếu hàng nhập mới
       ===================================================== */
    const renderCreateProductRow = (row, index) => {
        const product = row.dataset.product || '';
        const category = row.dataset.category || '';
        const size = row.dataset.size || '';
        const color = row.dataset.color || '';
        const quantity = Number(row.dataset.quantity || 1);
        row.innerHTML = `
            <td>${index}</td>
            <td>${product}</td>
            <td>${category || '-'}</td>
            <td>${size || '-'}</td>
            <td>${color || '-'}</td>
            <td>${quantity}</td>
            <td>
                <div class="import-action-group">
                    <button class="import-action-btn edit" data-import-draft-edit title="Sửa sản phẩm"><i class='bx bx-edit-alt'></i></button>
                    <button class="import-action-btn delete" data-import-draft-delete title="Xóa sản phẩm"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        `;
    };

    const refreshCreateProductTable = () => {
        const list = root.querySelector('[data-import-product-list]');
        const rows = Array.from(list.querySelectorAll('tr')).filter((row) => !row.querySelector('.empty-row'));
        if (!rows.length) {
            list.innerHTML = '<tr><td colspan="7" class="empty-row">Chưa có sản phẩm. Thêm ở trên.</td></tr>';
            return;
        }
        rows.forEach((row, index) => renderCreateProductRow(row, index + 1));
    };

    const addProductToCreateForm = () => {
        const productSelect = root.querySelector('[data-import-product]');
        const categorySelect = root.querySelector('[data-import-category]');
        const sizeInput = root.querySelector('[data-import-size]');
        const colorInput = root.querySelector('[data-import-color]');
        const qtyInput = root.querySelector('[data-import-qty]');
        const imageInput = root.querySelector('[data-import-image]');
        const list = root.querySelector('[data-import-product-list]');
        const product = productSelect.value.trim();
        if (!product) {
            alert('Vui lòng nhập tên sản phẩm.');
            return;
        }
        if (!validSelect(categorySelect)) {
            alert('Vui lòng chọn danh mục sản phẩm.');
            return;
        }

        const quantity = Math.max(1, Number(qtyInput.value || 1));
        const empty = list.querySelector('.empty-row');
        if (empty) empty.closest('tr').remove();

        const row = document.createElement('tr');
        const catalogItem = findCatalogProduct(product)?.[1] || {};
        row.dataset.product = product;
        row.dataset.productId = catalogItem.productId || '';
        row.dataset.category = categorySelect.value;
        row.dataset.size = sizeInput.value.trim();
        row.dataset.color = colorInput.value.trim();
        row.dataset.quantity = String(quantity);
        row.dataset.image = imageInput.value.trim();
        row.dataset.price = String(catalogItem.price || 0);
        list.appendChild(row);
        refreshCreateProductTable();
        productSelect.value = '';
        categorySelect.value = '';
        sizeInput.value = '';
        colorInput.value = '';
        qtyInput.value = '1';
        imageInput.value = '';
    };

    const findCatalogProduct = (name) => {
        const keyword = normalize(name);
        return Object.entries(productCatalog).find(([productName]) => normalize(productName) === keyword);
    };

    const fillProductInfoFromCatalog = () => {
        const productInput = root.querySelector('[data-import-product]');
        const categorySelect = root.querySelector('[data-import-category]');
        const sizeInput = root.querySelector('[data-import-size]');
        const colorInput = root.querySelector('[data-import-color]');
        const qtyInput = root.querySelector('[data-import-qty]');
        const imageInput = root.querySelector('[data-import-image]');
        const matched = findCatalogProduct(productInput.value.trim());

        if (!matched) {
            categorySelect.value = '';
            sizeInput.value = '';
            colorInput.value = '';
            qtyInput.value = '1';
            imageInput.value = '';
            return;
        }

        const [, info] = matched;
        categorySelect.value = info.category || '';
        sizeInput.value = info.size || '';
        colorInput.value = info.color || '';
        qtyInput.value = String(info.quantity || 1);
        imageInput.value = info.image || '';
    };

    const openDraftProductEdit = (row) => {
        let modal = root.querySelector('#import-draft-edit');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'import-modal';
            modal.id = 'import-draft-edit';
            modal.addEventListener('click', (event) => {
                if (event.target === modal) closeModal(modal);
            });
            root.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="import-dialog detail">
                <div class="import-modal-header"><h3>Sửa sản phẩm nhập</h3><button class="modal-close" data-import-close>&times;</button></div>
                <div class="import-modal-body">
                    <div class="form-grid">
                        <div class="field"><label>Tên sản phẩm</label><input data-draft-field="product" value="${row.dataset.product || ''}"></div>
                        <div class="field"><label>Danh mục</label><select data-draft-field="category"><option value="">Chọn danh mục</option><option>Áo bé trai</option><option>Áo bé gái</option><option>Đầm váy</option><option>Quần bé trai</option><option>Đồ chơi</option></select></div>
                        <div class="field"><label>Size</label><input data-draft-field="size" value="${row.dataset.size || ''}"></div>
                        <div class="field"><label>Màu sắc</label><input data-draft-field="color" value="${row.dataset.color || ''}"></div>
                        <div class="field"><label>Số lượng</label><input type="number" min="1" data-draft-field="quantity" value="${row.dataset.quantity || 1}"></div>
                        <div class="field"><label>Ảnh sản phẩm</label><input data-draft-field="image" value="${row.dataset.image || ''}"></div>
                    </div>
                    <div class="import-modal-actions"><button class="import-btn light" data-import-close>Hủy</button><button class="import-btn primary" data-save-draft-product>Lưu thay đổi</button></div>
                </div>
            </div>
        `;
        modal.classList.add('active');
        modal.querySelector('[data-draft-field="category"]').value = row.dataset.category || '';

        modal.querySelector('[data-save-draft-product]').onclick = () => {
            const product = modal.querySelector('[data-draft-field="product"]').value.trim();
            const category = modal.querySelector('[data-draft-field="category"]').value;
            const quantity = Math.max(1, Number(modal.querySelector('[data-draft-field="quantity"]').value || 1));
            if (!product) {
                alert('Vui lòng nhập tên sản phẩm.');
                return;
            }
            if (!category) {
                alert('Vui lòng chọn danh mục sản phẩm.');
                return;
            }
            row.dataset.product = product;
            row.dataset.category = category;
            row.dataset.size = modal.querySelector('[data-draft-field="size"]').value.trim();
            row.dataset.color = modal.querySelector('[data-draft-field="color"]').value.trim();
            row.dataset.quantity = String(quantity);
            row.dataset.image = modal.querySelector('[data-draft-field="image"]').value.trim();
            refreshCreateProductTable();
            closeModal(modal);
        };
    };

    const deleteDraftProduct = (row) => {
        row.remove();
        refreshCreateProductTable();
    };
    const nextImportCode = () => {
        const max = Array.from(root.querySelectorAll('#import-table tr strong')).reduce((current, item) => {
            const number = Number(item.textContent.replace('NH', ''));
            return Number.isFinite(number) ? Math.max(current, number) : current;
        }, 0);
        return `NH${String(max + 1).padStart(3, '0')}`;
    };

    const collectCreateProducts = () => {
        return Array.from(root.querySelectorAll('[data-import-product-list] tr')).filter((row) => !row.querySelector('.empty-row')).map((row) => ({
            product: row.dataset.product,
            category: row.dataset.category,
            size: row.dataset.size,
            color: row.dataset.color,
            quantity: Number(row.dataset.quantity || 0),
            image: row.dataset.image || '',
            product_id: row.dataset.productId || '',
            price: Number(row.dataset.price || 0)
        }));
    };

    const createImport = async () => {
        const supplier = root.querySelector('[data-import-field="supplier"]').value.trim();
        const date = root.querySelector('[data-import-field="date"]').value;
        const products = collectCreateProducts();
        if (!supplier) {
            alert('Vui lòng nhập nhà cung cấp.');
            return;
        }
        if (!products.length) {
            alert('Vui lòng thêm ít nhất một sản phẩm.');
            return;
        }

        if (window.kidCityApi) {
            try {
                await window.kidCityApi.post('imports/index.php', {
                    supplier,
                    import_date: date,
                    items: products.map((item) => ({
                        product_id: Number(item.product_id || 0),
                        quantity: Number(item.quantity || 1),
                        price: Number(item.price || 0)
                    }))
                });
                closeModal(root.querySelector('#import-create'));
                await loadImportsFromApi();
                return;
            } catch (error) {
                alert(error.message || 'Không thể tạo phiếu nhập hàng.');
                return;
            }
        }

        const code = nextImportCode();
        const row = document.createElement('tr');
        row.dataset.key = normalize(`${code} ${date} Nguyễn Văn An ${supplier}`);
        row.dataset.supplier = supplier;
        setProducts(row, products);
        row.innerHTML = `<td><strong>${code}</strong></td><td>${date}</td><td>Nguyễn Văn An</td><td></td>`;
        attachActions(row);
        root.querySelector('#import-table').prepend(row);
        root.querySelector('.import-stat strong').textContent = String(root.querySelectorAll('#import-table tr').length);
        currentPage = 1;
        renderPagination();
        closeModal(root.querySelector('#import-create'));
    };

    root.querySelector('[data-import-product]').addEventListener('input', fillProductInfoFromCatalog);
    root.querySelector('[data-import-product]').addEventListener('change', fillProductInfoFromCatalog);
    root.querySelector('[data-import-add-product]').addEventListener('click', addProductToCreateForm);
    root.querySelector('[data-import-save-create]').addEventListener('click', createImport);

    /* =====================================================
       IMPORT DETAIL - Cập nhật modal chi tiết theo dòng được bấm
       ===================================================== */
    const showImportDetail = (row) => {
        const modal = root.querySelector('#import-detail');
        const products = getProducts(row);
        modal.querySelector('.detail-title').textContent = `Chi tiết phiếu hàng nhập ${rowText(row, 0)}`;
        modal.querySelector('.detail-grid').innerHTML = `<div class="detail-item"><span>Người tạo phiếu</span><strong>${rowText(row, 2)}</strong></div><div class="detail-item"><span>Ngày nhập</span><strong>${rowText(row, 1)}</strong></div>`;
        modal.querySelector('tbody').innerHTML = productRowsHtml(products, false);
        openModal('import-detail');
    };

    /* =====================================================
       IMPORT EDIT - Sửa thông tin phiếu hàng nhập và số lượng đã lưu
       ===================================================== */
    const openImportEdit = (row) => {
        let modal = root.querySelector('#import-edit');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'import-modal';
            modal.id = 'import-edit';
            modal.addEventListener('click', (event) => {
                if (event.target === modal) closeModal(modal);
            });
            root.appendChild(modal);
        }

        const products = getProducts(row);
        const editRows = products.map((item, index) => `
            <tr>
                <td><input data-edit-product="${index}" value="${item.product}"></td>
                <td><input data-edit-category="${index}" value="${item.category || ''}"></td>
                <td><input data-edit-size="${index}" value="${item.size || ''}"></td>
                <td><input data-edit-color="${index}" value="${item.color || ''}"></td>
                <td><input type="number" min="1" data-edit-quantity="${index}" value="${item.quantity}"></td>
            </tr>
        `).join('');

        modal.innerHTML = `
            <div class="import-dialog detail import-edit-dialog">
                <div class="import-modal-header"><h3>Sửa phiếu hàng nhập ${rowText(row, 0)}</h3><button class="modal-close" data-import-close>&times;</button></div>
                <div class="import-modal-body">
                    <div class="form-grid">
                        <div class="field"><label>Mã phiếu hàng nhập</label><input data-edit-field="code" value="${rowText(row, 0)}" disabled></div>
                        <div class="field"><label>Ngày nhập</label><input type="date" data-edit-field="date" value="${rowText(row, 1)}"></div>
                        <div class="field"><label>Người tạo phiếu</label><input data-edit-field="staff" value="${rowText(row, 2)}"></div>
                        <div class="field"><label>Nhà cung cấp</label><input data-edit-field="supplier" value="${row.dataset.supplier || ''}"></div>
                    </div>
                    <h3 class="import-section-title">Chi tiết sản phẩm</h3>
                    <div class="import-card import-edit-products-card"><table class="import-table import-edit-table"><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Size</th><th>Màu</th><th>Số lượng nhập</th></tr></thead><tbody>${editRows}</tbody></table></div>
                    <div class="import-modal-actions"><button class="import-btn light" data-import-close>Hủy</button><button class="import-btn primary" data-save-import-edit>Lưu thay đổi</button></div>
                </div>
            </div>
        `;
        modal.classList.add('active');

        modal.querySelector('[data-save-import-edit]').onclick = () => {
            const date = modal.querySelector('[data-edit-field="date"]').value;
            const staff = modal.querySelector('[data-edit-field="staff"]').value.trim();
            const supplier = modal.querySelector('[data-edit-field="supplier"]').value.trim();
            const updatedProducts = products.map((_, index) => ({
                product: modal.querySelector(`[data-edit-product="${index}"]`).value.trim(),
                category: modal.querySelector(`[data-edit-category="${index}"]`).value.trim(),
                size: modal.querySelector(`[data-edit-size="${index}"]`).value.trim(),
                color: modal.querySelector(`[data-edit-color="${index}"]`).value.trim(),
                quantity: Math.max(1, Number(modal.querySelector(`[data-edit-quantity="${index}"]`).value || 1)),
                image: products[index].image || ''
            }));

            row.children[1].textContent = date;
            row.children[2].textContent = staff;
            row.dataset.supplier = supplier;
            row.dataset.key = normalize(`${rowText(row, 0)} ${date} ${staff} ${supplier}`);
            setProducts(row, updatedProducts);
            renderPagination();
            closeModal(modal);
        };
    };

    renderPagination();
    loadImportCatalogFromApi();
    loadImportsFromApi();
};
