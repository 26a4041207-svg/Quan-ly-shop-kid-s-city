window.initImportPage = function initImportPage(container) {
    const root = container.querySelector('#import-page');
    if (!root || root.dataset.importReady === 'true') return;
    root.dataset.importReady = 'true';

    /* =====================================================
       IMPORT DATA - Dữ liệu mẫu để tính tiền hàng nhập
       ===================================================== */
    const productCatalog = {};
    const defaultProducts = [];

    /* =====================================================
       IMPORT HELPERS - Hàm tiện ích dùng chung
       ===================================================== */
    const pageSize = 10;
    const storageKey = 'kidscity_import_receipts';
    let currentPage = 1;
    let currentProductVariants = [];
    let currentProductInfo = null;
    const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
    const normalize = (text) => (text || '').trim().toLowerCase();
    const escapeHtml = (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    const resolveProductImage = (item) => {
        const src = String(item?.image || item?.product_image || '').trim();
        const catalogImage = productCatalog[item?.product || '']?.image || '';
        if (src.startsWith('data:image/') && src.length <= 255) {
            return catalogImage || src;
        }
        if (src) return src;
        return catalogImage;
    };
    const fillThumbCell = (cell, imageSrc, thumbClass = 'import-product-thumb') => {
        if (!cell) return;
        cell.innerHTML = '';
        if (!imageSrc) {
            const empty = document.createElement('span');
            empty.className = 'import-no-image';
            empty.textContent = '-';
            cell.appendChild(empty);
            return;
        }
        const img = document.createElement('img');
        img.className = thumbClass;
        img.alt = 'Ảnh SP';
        img.src = imageSrc;
        img.onerror = () => {
            cell.innerHTML = '';
            const empty = document.createElement('span');
            empty.className = 'import-no-image';
            empty.textContent = '-';
            cell.appendChild(empty);
        };
        cell.appendChild(img);
    };
    const hydrateThumbCells = (container, products, selector = '[data-import-thumb-cell]') => {
        container.querySelectorAll(selector).forEach((cell, index) => {
            fillThumbCell(cell, resolveProductImage(products[index]));
        });
    };
    const updateCreateImagePreview = (src = '') => {
        const preview = root.querySelector('[data-import-product-image-preview]');
        if (!preview) return;
        if (src) {
            preview.innerHTML = '';
            const img = document.createElement('img');
            img.src = src;
            img.alt = 'Ảnh sản phẩm';
            preview.appendChild(img);
            preview.style.display = 'block';
        } else {
            preview.innerHTML = '';
            preview.style.display = 'none';
        }
    };
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
    const productRowsHtml = (products, includePrice = true) => {
        if (!products.length) return '<tr><td colspan="7" class="empty-row">Chưa có sản phẩm.</td></tr>';
        return products.map((item) => {
            return `<tr><td data-import-thumb-cell></td><td class="import-cell-wrap">${escapeHtml(item.product || '')}</td><td class="import-cell-wrap">${escapeHtml(item.category || '-')}</td><td>${escapeHtml(item.size || '-')}</td><td>${escapeHtml(item.color || '-')}</td><td><strong>${item.quantity || 0}</strong></td><td>${includePrice ? formatMoney(item.price) : '-'}</td></tr>`;
        }).join('');
    };

    const collectImportRecords = () => Array.from(root.querySelectorAll('#import-table tr')).map((row) => ({
        code: rowText(row, 0),
        date: rowText(row, 1),
        staff: rowText(row, 2),
        supplier: row.dataset.supplier || '',
        note: row.dataset.note || '',
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
            currentProductVariants = [];
            currentProductInfo = null;
            renderVariantsTable();
            // Clear creation form
            const supplierInput = root.querySelector('[data-import-field="supplier"]');
            const noteInput = root.querySelector('[data-import-field="note"]');
            if (supplierInput) supplierInput.value = '';
            if (noteInput) noteInput.value = '';
            
            const list = root.querySelector('[data-import-product-list]');
            if (list) list.innerHTML = '<tr><td colspan="8" class="empty-row">Chưa có sản phẩm. Thêm ở trên.</td></tr>';
            updateCreateImagePreview('');
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
            row.dataset.note = item.note || '';
            row.dataset.created = item.date || '';
            row.dataset.updated = item.date || '';
            setProducts(row, item.products || []);
            row.innerHTML = `<td><strong>${item.code}</strong></td><td>${item.date}</td><td>${item.staff}</td><td></td>`;
            body.appendChild(row);
        });
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
        image: item.product_image || item.image || ''
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
                row.dataset.id = receipt.id;
                row.dataset.key = normalize(`${receipt.code || ''} ${receipt.created_at || ''} ${receipt.staff_name || ''} ${receipt.supplier || ''}`);
                row.dataset.supplier = receipt.supplier || '';
                row.dataset.note = receipt.note || '';
                row.dataset.created = receipt.created_at || '';
                row.dataset.updated = receipt.updated_at || receipt.created_at || '';
                setProducts(row, products);
                row.innerHTML = `<td><strong>${receipt.code || ''}</strong></td><td>${(receipt.created_at || '').slice(0, 10)}</td><td>${receipt.staff_name || ''}</td><td></td>`;
                attachActions(row);
                body.appendChild(row);
            });
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

            const categorySelect = root.querySelector('[data-import-product-category]');
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
                const addedNames = new Set();
                products.forEach((product) => {
                    if (!product.name) return;
                    productCatalog[product.name] = {
                        productId: product.id,
                        category: product.category_name || '',
                        price: Number(product.price || 0),
                        image: product.image || '',
                        size: product.size || '',
                        color: product.color || ''
                    };
                    if (!addedNames.has(product.name)) {
                        addedNames.add(product.name);
                        const option = document.createElement('option');
                        option.value = product.name;
                        datalist.appendChild(option);
                    }
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
       IMPORT VARIANT SYSTEM - Hệ thống nhập chi tiết size/màu/số lượng
       ===================================================== */
    const renderVariantsTable = () => {
        const list = root.querySelector('[data-import-variants-list]');
        if (!list) return;
        
        if (!currentProductVariants.length) {
            list.innerHTML = '<tr><td colspan="4" class="empty-row" style="padding: 30px; text-align: center; color: #999;">Chưa có chi tiết. Thêm ở dưới.</td></tr>';
            return;
        }

        list.innerHTML = currentProductVariants.map((variant, index) => `
            <tr>
                <td>${variant.size || '-'}</td>
                <td>${variant.color || '-'}</td>
                <td>${variant.qty}</td>
                <td>
                    <div class="import-action-group">
                        <button class="import-action-btn edit" data-import-variant-edit="${index}" title="Sửa"><i class='bx bx-edit-alt'></i></button>
                        <button class="import-action-btn delete" data-import-variant-delete="${index}" title="Xóa"><i class='bx bx-trash'></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    };

    const addVariantToList = () => {
        const sizeInput = root.querySelector('[data-import-variant-size]');
        const colorInput = root.querySelector('[data-import-variant-color]');
        const qtyInput = root.querySelector('[data-import-variant-qty]');
        
        const size = sizeInput?.value.trim() || '';
        const color = colorInput?.value.trim() || '';
        const qty = Math.max(1, Number(qtyInput?.value || 1));

        if (!qty) {
            alert('Vui lòng nhập số lượng.');
            return;
        }

        currentProductVariants.push({ size, color, qty });
        
        if (sizeInput) sizeInput.value = '';
        if (colorInput) colorInput.value = '';
        if (qtyInput) qtyInput.value = '1';
        
        renderVariantsTable();
    };

    const deleteVariant = (index) => {
        currentProductVariants.splice(index, 1);
        renderVariantsTable();
    };

    const editVariant = (index) => {
        const variant = currentProductVariants[index];
        const sizeInput = root.querySelector('[data-import-variant-size]');
        const colorInput = root.querySelector('[data-import-variant-color]');
        const qtyInput = root.querySelector('[data-import-variant-qty]');
        
        if (sizeInput) sizeInput.value = variant.size;
        if (colorInput) colorInput.value = variant.color;
        if (qtyInput) qtyInput.value = variant.qty;
        
        currentProductVariants.splice(index, 1);
        renderVariantsTable();
    };

    const fillProductInfoFromCatalog = () => {
        const productInput = root.querySelector('[data-import-product-name]');
        const categorySelect = root.querySelector('[data-import-product-category]');
        const priceInput = root.querySelector('[data-import-product-price]');
        const imageInput = root.querySelector('[data-import-product-image]');
        
        const productName = productInput?.value.trim();
        const catalogItem = productCatalog[productName];

        if (catalogItem) {
            categorySelect.value = catalogItem.category;
            priceInput.value = catalogItem.price;
            currentProductInfo = { image: catalogItem.image || '' };
            updateCreateImagePreview(catalogItem.image || '');
            if (imageInput) imageInput.value = '';
        } else {
            categorySelect.value = '';
            priceInput.value = '';
            currentProductInfo = null;
            updateCreateImagePreview('');
        }
    };

    const addFullProductToImport = () => {
        const productInput = root.querySelector('[data-import-product-name]');
        const imageInput = root.querySelector('[data-import-product-image]');
        const categorySelect = root.querySelector('[data-import-product-category]');
        const priceInput = root.querySelector('[data-import-product-price]');
        
        const productName = productInput?.value.trim();
        if (!productName || !validSelect(categorySelect) || !priceInput?.value) {
            alert('Vui lòng nhập tên sản phẩm, chọn danh mục và giá bán.');
            return;
        }

        if (!currentProductVariants.length) {
            alert('Vui lòng thêm ít nhất một chi tiết sản phẩm (size/màu/số lượng).');
            return;
        }

        const list = root.querySelector('[data-import-product-list]');
        const empty = list.querySelector('.empty-row');
        if (empty) empty.closest('tr').remove();

        const imageFile = imageInput?.files && imageInput.files[0];
        
        const appendRow = (imgDataUrl = '') => {
            currentProductVariants.forEach((variant) => {
                const row = document.createElement('tr');
                row.dataset.product = productName;
                row.dataset.category = categorySelect.value;
                row.dataset.image = imgDataUrl;
                row.dataset.price = priceInput.value;
                row.dataset.size = variant.size;
                row.dataset.color = variant.color;
                row.dataset.quantity = variant.qty;
                
                const list = root.querySelector('[data-import-product-list]');
                const rowNumber = list.querySelectorAll('tr:not(.empty-row)').length + 1;

                row.innerHTML = `
                    <td>${rowNumber}</td>
                    <td data-import-thumb-cell></td>
                    <td class="import-cell-wrap">${escapeHtml(productName)}</td>
                    <td class="import-cell-wrap">${escapeHtml(categorySelect.value)}</td>
                    <td>${escapeHtml(variant.size || '-')}/${escapeHtml(variant.color || '-')}</td>
                    <td>${variant.qty}</td>
                    <td>${formatMoney(priceInput.value)}</td>
                    <td>
                        <div class="import-action-group">
                            <button class="import-action-btn edit" data-import-product-edit title="Sửa"><i class='bx bx-edit-alt'></i></button>
                            <button class="import-action-btn delete" data-import-product-delete title="Xóa"><i class='bx bx-trash'></i></button>
                        </div>
                    </td>
                `;
                fillThumbCell(row.querySelector('[data-import-thumb-cell]'), imgDataUrl);
                list.appendChild(row);
            });

            if (productInput) productInput.value = '';
            if (imageInput) imageInput.value = '';
            if (categorySelect) categorySelect.value = '';
            if (priceInput) priceInput.value = '';
            currentProductInfo = null;
            updateCreateImagePreview('');
            
            currentProductVariants = [];
            renderVariantsTable();
        };

        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (event) => {
                appendRow(event.target?.result || '');
            };
            reader.readAsDataURL(imageFile);
        } else {
            const catalogImage = productCatalog[productName]?.image || currentProductInfo?.image || '';
            appendRow(catalogImage);
        }
    };

    root.addEventListener('click', (event) => {
        if (event.target.closest('[data-import-add-variant]')) {
            addVariantToList();
        }

        const variantDelete = event.target.closest('[data-import-variant-delete]');
        if (variantDelete) {
            deleteVariant(Number(variantDelete.dataset.importVariantDelete));
        }

        const variantEdit = event.target.closest('[data-import-variant-edit]');
        if (variantEdit) {
            editVariant(Number(variantEdit.dataset.importVariantEdit));
        }

        const productDelete = event.target.closest('[data-import-product-delete]');
        if (productDelete && root.contains(productDelete)) {
            productDelete.closest('tr').remove();
            const list = productDelete.closest('tbody');
            if (!list.querySelector('tr:not(.empty-row)')) {
                list.innerHTML = '<tr><td colspan="8" class="empty-row">Chưa có sản phẩm. Thêm ở trên.</td></tr>';
            } else {
                const rows = list.querySelectorAll('tr:not(.empty-row)');
                rows.forEach((tr, idx) => {
                    tr.children[0].textContent = idx + 1;
                });
            }
        }

        const productEdit = event.target.closest('[data-import-product-edit]');
        if (productEdit && root.contains(productEdit)) {
            const tr = productEdit.closest('tr');
            const productInput = root.querySelector('[data-import-product-name]');
            const categorySelect = root.querySelector('[data-import-product-category]');
            const priceInput = root.querySelector('[data-import-product-price]');
            const imageInput = root.querySelector('[data-import-product-image]');
            
            if (productInput) productInput.value = tr.dataset.product || '';
            if (categorySelect) categorySelect.value = tr.dataset.category || '';
            if (priceInput) priceInput.value = tr.dataset.price || '';
            if (imageInput) imageInput.value = '';
            currentProductInfo = { image: tr.dataset.image || '' };
            updateCreateImagePreview(tr.dataset.image || '');
            
            currentProductVariants = [{
                size: tr.dataset.size || '',
                color: tr.dataset.color || '',
                qty: Number(tr.dataset.quantity || 1)
            }];
            renderVariantsTable();
            tr.remove();
        }

        // ADD CATEGORY DIALOG OPEN
        if (event.target.closest('[data-import-add-category]')) {
            openModal('import-add-category');
            const catNameInput = root.querySelector('[data-import-new-category-name]');
            const catDescInput = root.querySelector('[data-import-new-category-desc]');
            if (catNameInput) catNameInput.value = '';
            if (catDescInput) catDescInput.value = '';
        }

        // SAVE NEW CATEGORY
        if (event.target.closest('[data-import-save-new-category]')) {
            const name = root.querySelector('[data-import-new-category-name]')?.value.trim();
            const description = root.querySelector('[data-import-new-category-desc]')?.value.trim() || '';
            if (!name) {
                alert('Vui lòng nhập tên danh mục.');
                return;
            }
            if (window.kidCityApi) {
                window.kidCityApi.post('products/categories.php', { name, description })
                    .then(async (res) => {
                        await loadImportCatalogFromApi();
                        const categorySelect = root.querySelector('[data-import-product-category]');
                        if (categorySelect) categorySelect.value = name;
                        closeModal(root.querySelector('#import-add-category'));
                    })
                    .catch((err) => alert(err.message || 'Không thể thêm danh mục.'));
            } else {
                alert('Chế độ Offline: không thể thêm danh mục mới.');
            }
        }
    });

    root.querySelector('[data-import-product-name]')?.addEventListener('input', fillProductInfoFromCatalog);
    root.querySelector('[data-import-product-name]')?.addEventListener('change', fillProductInfoFromCatalog);
    root.querySelector('[data-import-product-image]')?.addEventListener('change', (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            fillProductInfoFromCatalog();
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target?.result || '';
            currentProductInfo = { image: imageData };
            updateCreateImagePreview(imageData);
        };
        reader.readAsDataURL(file);
    });
    root.querySelector('[data-import-add-full-product]')?.addEventListener('click', addFullProductToImport);
    
    const collectCreateProducts = () => {
        return Array.from(root.querySelectorAll('[data-import-product-list] tr')).filter((row) => !row.querySelector('.empty-row')).map((row) => ({
            product: row.dataset.product,
            category: row.dataset.category,
            size: row.dataset.size,
            color: row.dataset.color,
            quantity: Number(row.dataset.quantity || 1),
            image: row.dataset.image || '',
            price: Number(row.dataset.price || 0)
        }));
    };

    const createImport = async () => {
        const supplier = root.querySelector('[data-import-field="supplier"]').value.trim();
        const note = root.querySelector('[data-import-field="note"]').value.trim();
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
                    note,
                    items: products.map((item) => ({
                        name: item.product,
                        category_name: item.category,
                        size: item.size,
                        color: item.color,
                        quantity: item.quantity,
                        price: item.price, // Selling price
                        image: item.image
                    }))
                });
                closeModal(root.querySelector('#import-create'));
                await loadImportsFromApi();
                window.showToast?.('Tạo phiếu nhập hàng thành công!');
                return;
            } catch (error) {
    console.error('CREATE IMPORT ERROR:', error);
    alert(error.message || 'Không thể tạo phiếu nhập hàng.');
}
        } else {
            alert('Không thể tạo phiếu nhập ở chế độ offline.');
        }
    };

    root.querySelector('[data-import-save-create]')?.addEventListener('click', createImport);

    /* =====================================================
       IMPORT DETAIL - Cập nhật modal chi tiết theo dòng được bấm
       ===================================================== */
    const showImportDetail = (row) => {
        const modal = root.querySelector('#import-detail');
        const products = getProducts(row);
        
        modal.querySelector('[data-detail-code]').textContent = rowText(row, 0);
        modal.querySelector('[data-detail-created]').textContent = row.dataset.created || '-';
        modal.querySelector('[data-detail-updated]').textContent = row.dataset.updated || '-';
        modal.querySelector('[data-detail-staff]').textContent = rowText(row, 2);
        modal.querySelector('[data-detail-supplier]').textContent = row.dataset.supplier || '-';
        modal.querySelector('[data-detail-note]').textContent = row.dataset.note || 'Không có';
        
        modal.querySelector('[data-detail-product-list]').innerHTML = productRowsHtml(products, true);
        hydrateThumbCells(modal.querySelector('[data-detail-product-list]'), products);
        openModal('import-detail');
    };

    /* =====================================================
       IMPORT EDIT - Sửa thông tin phiếu hàng nhập và số lượng đã lưu
       ===================================================== */
    const openImportEdit = (row) => {
        const modal = root.querySelector('#import-edit');
        const products = getProducts(row);
        const importId = row.dataset.id;

        modal.querySelector('[data-import-edit-code]').value = rowText(row, 0);
        modal.querySelector('[data-import-edit-staff]').value = rowText(row, 2);
        modal.querySelector('[data-import-edit-created]').value = row.dataset.created || '';
        modal.querySelector('[data-import-edit-updated]').value = row.dataset.updated || '';
        modal.querySelector('[data-import-edit-supplier]').value = row.dataset.supplier || '';
        modal.querySelector('[data-import-edit-note]').value = row.dataset.note || '';

        const renderEditTable = () => {
            modal.querySelector('[data-import-edit-product-list]').innerHTML = products.map((item, index) => `
                <tr data-index="${index}">
                    <td class="col-image">
                        <div class="import-edit-image-cell">
                            <div class="edit-item-image-preview-wrap" data-edit-image-preview></div>
                            <input type="file" class="edit-item-image" accept="image/*">
                            <input type="hidden" class="edit-item-image-data">
                        </div>
                    </td>
                    <td class="col-product"><textarea class="edit-item-product" rows="2">${escapeHtml(item.product)}</textarea></td>
                    <td class="col-category"><textarea class="edit-item-category" rows="2">${escapeHtml(item.category || '')}</textarea></td>
                    <td class="col-size"><input type="text" class="edit-item-size" value="${escapeHtml(item.size || '')}"></td>
                    <td class="col-color"><input type="text" class="edit-item-color" value="${escapeHtml(item.color || '')}"></td>
                    <td class="col-qty"><input type="number" class="edit-item-qty" min="1" value="${item.quantity}"></td>
                    <td class="col-price"><input type="number" class="edit-item-price" min="0" value="${item.price}"></td>
                    <td class="col-action">
                        <button type="button" class="import-action-btn delete" data-edit-delete-row="${index}"><i class='bx bx-trash'></i></button>
                    </td>
                </tr>
            `).join('');

            const editBody = modal.querySelector('[data-import-edit-product-list]');
            editBody.querySelectorAll('tr').forEach((tr, index) => {
                const imageSrc = resolveProductImage(products[index]);
                const hidden = tr.querySelector('.edit-item-image-data');
                if (hidden) hidden.value = imageSrc;
                fillThumbCell(tr.querySelector('[data-edit-image-preview]'), imageSrc, 'edit-item-image-preview');
            });
        };

        renderEditTable();

        const tbody = modal.querySelector('[data-import-edit-product-list]');

        const readEditProductsFromTable = () => {
            const rows = tbody.querySelectorAll('tr');
            const currentProducts = [];
            rows.forEach((tr) => {
                currentProducts.push({
                    product: tr.querySelector('.edit-item-product').value,
                    category: tr.querySelector('.edit-item-category').value,
                    size: tr.querySelector('.edit-item-size').value,
                    color: tr.querySelector('.edit-item-color').value,
                    quantity: Number(tr.querySelector('.edit-item-qty').value || 1),
                    price: Number(tr.querySelector('.edit-item-price').value || 0),
                    image: tr.querySelector('.edit-item-image-data')?.value || ''
                });
            });
            return currentProducts;
        };

        // Bind delete row inside edit table
        tbody.onclick = (e) => {
            const deleteBtn = e.target.closest('[data-edit-delete-row]');
            if (deleteBtn) {
                const currentProducts = readEditProductsFromTable();

                const idx = Number(deleteBtn.dataset.editDeleteRow);
                currentProducts.splice(idx, 1);
                
                products.length = 0;
                products.push(...currentProducts);
                renderEditTable();
            }
        };

        // Bind add row inside edit table
        const addRowBtn = modal.querySelector('[data-import-edit-add-row]');
        tbody.onchange = (e) => {
            const fileInput = e.target.closest('.edit-item-image');
            if (!fileInput || !fileInput.files?.[0]) return;
            const tr = fileInput.closest('tr');
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target?.result || '';
                const hiddenInput = tr.querySelector('.edit-item-image-data');
                if (hiddenInput) hiddenInput.value = imageData;
                const previewWrap = tr.querySelector('[data-edit-image-preview]');
                if (previewWrap) fillThumbCell(previewWrap, imageData, 'edit-item-image-preview');
            };
            reader.readAsDataURL(fileInput.files[0]);
        };

        if (addRowBtn) {
            addRowBtn.onclick = () => {
                const currentProducts = readEditProductsFromTable();

                currentProducts.push({
                    product: '',
                    category: '',
                    size: '',
                    color: '',
                    quantity: 1,
                    price: 0,
                    image: ''
                });

                products.length = 0;
                products.push(...currentProducts);
                renderEditTable();
            };
        }

        modal.querySelector('[data-import-save-edit]').onclick = async () => {
            const supplier = modal.querySelector('[data-import-edit-supplier]').value.trim();
            const note = modal.querySelector('[data-import-edit-note]').value.trim();
            
            if (!supplier) {
                alert('Vui lòng nhập nhà cung cấp.');
                return;
            }

            // Read items from inputs
            const updatedItems = [];
            const rows = tbody.querySelectorAll('tr');
            rows.forEach((tr) => {
                updatedItems.push({
                    name: tr.querySelector('.edit-item-product').value.trim(),
                    category_name: tr.querySelector('.edit-item-category').value.trim(),
                    size: tr.querySelector('.edit-item-size').value.trim(),
                    color: tr.querySelector('.edit-item-color').value.trim(),
                    quantity: Number(tr.querySelector('.edit-item-qty').value || 1),
                    price: Number(tr.querySelector('.edit-item-price').value || 0),
                    image: tr.querySelector('.edit-item-image-data')?.value || ''
                });
            });

            if (!updatedItems.length) {
                alert('Vui lòng thêm ít nhất một sản phẩm.');
                return;
            }

            if (window.kidCityApi) {
                try {
                    await window.kidCityApi.put('imports/index.php', {
                        id: importId,
                        supplier,
                        note,
                        items: updatedItems
                    });
                    closeModal(modal);
                    await loadImportsFromApi();
                    window.showToast?.('Cập nhật phiếu nhập hàng thành công!');
                } catch (error) {
                    alert(error.message || 'Không thể cập nhật phiếu nhập hàng.');
                }
            } else {
                alert('Không thể cập nhật phiếu ở chế độ offline.');
            }
        };

        openModal('import-edit');
    };

    renderPagination();
    loadImportCatalogFromApi().then(() => loadImportsFromApi());
};

