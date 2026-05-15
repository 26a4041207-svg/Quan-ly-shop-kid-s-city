window.initSalePage = function initSalePage(container) {
    const root = container.querySelector('.sales-page');
    if (!root || root.dataset.saleReady === 'true') return;
    root.dataset.saleReady = 'true';

    /* =====================================================
       COMMON DATA - Dữ liệu mẫu dùng để tính tiền frontend
       ===================================================== */
    const prices = {
        'Áo thun Mickey Mouse': 120000,
        'Áo thun Elsa Frozen': 135000,
        'Váy hoa nhí công chúa': 220000
    };

    // Mã sản phẩm hiển thị dạng link trong form tạo hóa đơn. href đang để # để sau này nối sang trang chi tiết sản phẩm.
    const productCodes = {
        'Áo thun Mickey Mouse': 'SP001',
        'Áo thun Elsa Frozen': 'SP002',
        'Váy hoa nhí công chúa': 'SP003'
    };

    // Dữ liệu mẫu của trang còn lại để chặn một hóa đơn bị đổi/trả nhiều lần khi từng trang được load riêng.
    const initialExchangeInvoiceCodes = ['HD001', 'HD002', 'HD003', 'HD005', 'HD008'];
    const initialReturnInvoiceCodes = ['HD002', 'HD004', 'HD005', 'HD009', 'HD011'];

    /* =====================================================
       COMMON HELPERS - Hàm tiện ích dùng chung nhiều trang
       ===================================================== */
    const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
    const today = () => new Date().toISOString().slice(0, 10);
    const normalize = (text) => (text || '').trim().toLowerCase();
    const validSelect = (select) => select && select.value && !select.value.includes('--');
    const countRows = (tableSelector) => root.querySelectorAll(`${tableSelector} tr`).length;

    const nextCode = (tableSelector, prefix) => {
        const rows = Array.from(root.querySelectorAll(`${tableSelector} tr strong:first-child`));
        const max = rows.reduce((currentMax, item) => {
            const number = Number(item.textContent.replace(prefix, ''));
            return Number.isFinite(number) ? Math.max(currentMax, number) : currentMax;
        }, 0);
        return `${prefix}${String(max + 1).padStart(3, '0')}`;
    };

    const updateFirstStat = (value) => {
        const firstStat = root.querySelector('.sales-stat strong');
        if (firstStat) firstStat.textContent = String(value);
    };

    const attachActions = (cell, type, detailId) => {
        cell.innerHTML = `
            <div class="action-group">
                <button class="action-btn view" data-open="${detailId}" title="Xem chi tiết"><i class='bx bx-show'></i></button>
                <button class="action-btn edit" data-edit="${type}" title="Sửa"><i class='bx bx-edit-alt'></i></button>
                <button class="action-btn delete" data-delete="${type}" title="Xóa"><i class='bx bx-trash'></i></button>
            </div>
        `;
    };

    const rowText = (row, index) => row.children[index]?.textContent.trim() || '';
    const invoiceLink = (code) => `<a class="invoice-code-link" href="#">${code}</a>`;

    const usedInvoiceCodes = () => {
        const otherPageCodes = root.id === 'exchange-page' ? initialReturnInvoiceCodes : initialExchangeInvoiceCodes;
        const codes = new Set(otherPageCodes);
        root.querySelectorAll('#exchange-table tr, #return-table tr').forEach((row) => {
            const code = rowText(row, 1);
            if (code) codes.add(code);
        });
        return codes;
    };

    const invoiceAlreadyProcessed = (invoiceCode) => usedInvoiceCodes().has(invoiceCode);
    const setCell = (row, index, value) => {
        if (row.children[index]) row.children[index].textContent = value;
    };

    const updateRowKey = (row) => {
        row.dataset.key = normalize(Array.from(row.children).slice(0, -1).map((cell) => cell.textContent).join(' '));
    };

    const hydrateActionCells = (tableSelector, type, detailId) => {
        root.querySelectorAll(`${tableSelector} tr`).forEach((row) => {
            attachActions(row.lastElementChild, type, detailId);
        });
    };

    /* =====================================================
       COMMON MODAL - Mở/đóng popup dùng chung các trang sale
       ===================================================== */
    const openModal = (id) => {
        const modal = root.querySelector('#' + id);
        if (modal) modal.classList.add('active');
    };

    const closeModal = (modal) => {
        if (modal) modal.classList.remove('active');
    };

    root.addEventListener('click', (event) => {
        const openBtn = event.target.closest('[data-open]');
        if (openBtn && root.contains(openBtn)) {
            openModal(openBtn.dataset.open);
            return;
        }

        const closeBtn = event.target.closest('[data-close]');
        if (closeBtn && root.contains(closeBtn)) {
            closeModal(closeBtn.closest('.sales-modal'));
            return;
        }

        const editBtn = event.target.closest('[data-edit]');
        if (editBtn && root.contains(editBtn)) {
            openEditModal(editBtn.closest('tr'), editBtn.dataset.edit);
            return;
        }

        const deleteBtn = event.target.closest('[data-delete]');
        if (deleteBtn && root.contains(deleteBtn)) {
            openDeleteModal(deleteBtn.closest('tr'), deleteBtn.dataset.delete);
        }
    });

    root.querySelectorAll('.sales-modal').forEach((modal) => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeModal(modal);
        });
    });

    /* =====================================================
       INVOICES PAGINATION - Phân trang hóa đơn 6 dòng/trang
       ===================================================== */
    const invoicePageSize = 6;
    let invoiceCurrentPage = 1;

    const getFilteredInvoiceRows = () => {
        const tableBody = root.querySelector('#invoice-table');
        const searchInput = root.querySelector('#invoice-search');
        if (!tableBody) return [];

        const keyword = normalize(searchInput ? searchInput.value : '');
        return Array.from(tableBody.querySelectorAll('tr')).filter((row) => {
            return normalize(row.dataset.key).includes(keyword);
        });
    };

    const renderInvoicePagination = () => {
        if (root.id !== 'invoice-page') return;

        const tableBody = root.querySelector('#invoice-table');
        const pagination = root.querySelector('#invoice-pagination');
        if (!tableBody || !pagination) return;

        const allRows = Array.from(tableBody.querySelectorAll('tr'));
        const filteredRows = getFilteredInvoiceRows();
        const totalPages = Math.max(1, Math.ceil(filteredRows.length / invoicePageSize));
        if (invoiceCurrentPage > totalPages) invoiceCurrentPage = totalPages;

        const start = (invoiceCurrentPage - 1) * invoicePageSize;
        const visibleRows = new Set(filteredRows.slice(start, start + invoicePageSize));
        allRows.forEach((row) => {
            row.style.display = visibleRows.has(row) ? '' : 'none';
        });

        if (!filteredRows.length) {
            pagination.innerHTML = '';
            return;
        }

        const pageButtons = Array.from({ length: totalPages }, (_, index) => {
            const page = index + 1;
            const active = page === invoiceCurrentPage ? ' active' : '';
            return `<button class="page-btn${active}" data-page="${page}">${page}</button>`;
        }).join('');

        pagination.innerHTML = `
            <button class="page-btn" data-page="prev" ${invoiceCurrentPage === 1 ? 'disabled' : ''}>‹</button>
            ${pageButtons}
            <button class="page-btn" data-page="next" ${invoiceCurrentPage === totalPages ? 'disabled' : ''}>›</button>
        `;
    };

    const bindInvoicePagination = () => {
        const pagination = root.querySelector('#invoice-pagination');
        if (!pagination) return;

        pagination.addEventListener('click', (event) => {
            const btn = event.target.closest('.page-btn');
            if (!btn || btn.disabled) return;

            const totalPages = Math.max(1, Math.ceil(getFilteredInvoiceRows().length / invoicePageSize));
            if (btn.dataset.page === 'prev') invoiceCurrentPage = Math.max(1, invoiceCurrentPage - 1);
            else if (btn.dataset.page === 'next') invoiceCurrentPage = Math.min(totalPages, invoiceCurrentPage + 1);
            else invoiceCurrentPage = Number(btn.dataset.page);

            renderInvoicePagination();
        });
    };

    /* =====================================================
       COMMON SEARCH - Tìm kiếm bảng; hóa đơn dùng kèm phân trang
       ===================================================== */
    /* =====================================================
       COMMON EDIT/DELETE - Sửa/xóa bằng popup giữa màn hình
       ===================================================== */
    const showWorkModal = (id, title, bodyHtml, footerHtml) => {
        let modal = root.querySelector('#' + id);
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'sales-modal';
            modal.id = id;
            modal.addEventListener('click', (event) => {
                if (event.target === modal) closeModal(modal);
            });
            root.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="sales-dialog detail edit-dialog">
                <div class="sales-modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" data-close>&times;</button>
                </div>
                <div class="sales-modal-body">
                    ${bodyHtml}
                    <div class="modal-actions">${footerHtml}</div>
                </div>
            </div>
        `;
        modal.classList.add('active');
        return modal;
    };

    const fieldValue = (modal, name) => modal.querySelector(`[data-field="${name}"]`)?.value.trim() || '';
    const moneyNumber = (text) => Number(String(text || '').replace(/[^0-9]/g, '')) || 0;

    const openEditModal = (row, type) => {
        if (!row) return;
        if (type === 'invoice') openInvoiceEditModal(row);
        if (type === 'exchange') openExchangeEditModal(row);
        if (type === 'return') openReturnEditModal(row);
    };

    const openInvoiceEditModal = (row) => {
        const code = rowText(row, 0);
        const modal = showWorkModal('invoice-edit-modal', `Sửa hóa đơn ${code}`, `
            <div class="edit-summary">Cập nhật thông tin chính của hóa đơn. Phần chi tiết sản phẩm đang sửa ở mức dữ liệu giao diện.</div>
            <div class="form-grid edit-grid">
                <div class="field"><label>Mã hóa đơn</label><input data-field="code" value="${code}" disabled></div>
                <div class="field"><label>Ngày lập</label><input type="date" data-field="date" value="${rowText(row, 1)}"></div>
                <div class="field"><label>Khách hàng</label><input data-field="customer" value="${rowText(row, 2)}"></div>
                <div class="field"><label>Nhân viên</label><input data-field="staff" value="${rowText(row, 3)}"></div>
                <div class="field"><label>Tổng tiền</label><input data-field="total" value="${rowText(row, 4)}"></div>
                <div class="field"><label>PTTT</label><select data-field="payment"><option ${rowText(row, 5) === 'Tiền mặt' ? 'selected' : ''}>Tiền mặt</option><option ${rowText(row, 5) === 'Chuyển khoản' ? 'selected' : ''}>Chuyển khoản</option></select></div>
            </div>
            <h3 class="section-title edit-section-title">Chi tiết hóa đơn</h3>
            <table class="sales-table"><thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead><tbody><tr><td>Áo thun Mickey Mouse</td><td>120.000đ</td><td>1</td><td><strong>120.000đ</strong></td></tr></tbody></table>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary" data-save-edit="invoice">Lưu thay đổi</button>`);

        modal.querySelector('[data-save-edit="invoice"]').onclick = () => {
            const totalText = fieldValue(modal, 'total') || '0đ';
            row.innerHTML = `<td><strong>${code}</strong></td><td>${fieldValue(modal, 'date')}</td><td>${fieldValue(modal, 'customer')}</td><td>${fieldValue(modal, 'staff')}</td><td class="green font-weight-600">${totalText}</td><td>${fieldValue(modal, 'payment')}</td><td></td>`;
            attachActions(row.lastElementChild, 'invoice', 'invoice-detail');
            updateRowKey(row);
            renderInvoicePagination();
            closeModal(modal);
        };
    };

    const openExchangeEditModal = (row) => {
        const code = rowText(row, 0);
        const reason = row.dataset.reason || 'Đổi sang mẫu khác';
        const oldProduct = row.dataset.oldProduct || 'Áo thun Mickey Mouse';
        const newProduct = row.dataset.newProduct || 'Áo thun Elsa Frozen';
        const quantity = row.dataset.quantity || '1';
        const modal = showWorkModal('exchange-edit-modal', `Sửa phiếu đổi ${code}`, `
            <div class="edit-summary">Cập nhật thông tin phiếu đổi và chi tiết sản phẩm đổi.</div>
            <div class="form-grid edit-grid">
                <div class="field"><label>Mã đổi hàng</label><input data-field="code" value="${code}" disabled></div>
                <div class="field"><label>Mã hóa đơn</label><input data-field="invoiceCode" value="${rowText(row, 1)}"></div>
                <div class="field"><label>Ngày đổi</label><input type="date" data-field="date" value="${rowText(row, 2)}"></div>
                <div class="field"><label>Nhân viên xử lý</label><input data-field="staff" value="${rowText(row, 3)}"></div>
                <div class="field full"><label>Lý do</label><input data-field="reason" value="${reason}"></div>
            </div>
            <h3 class="section-title edit-section-title">Chi tiết đổi hàng</h3>
            <div class="form-grid edit-grid">
                <div class="field"><label>SP cũ</label><input data-field="oldProduct" value="${oldProduct}"></div>
                <div class="field"><label>SP mới</label><input data-field="newProduct" value="${newProduct}"></div>
                <div class="field"><label>Số lượng</label><input type="number" min="1" data-field="quantity" value="${quantity}"></div>
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary" data-save-edit="exchange">Lưu thay đổi</button>`);

        modal.querySelector('[data-save-edit="exchange"]').onclick = () => {
            row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(fieldValue(modal, 'invoiceCode'))}</td><td>${fieldValue(modal, 'date')}</td><td>${fieldValue(modal, 'staff')}</td><td></td>`;
            row.dataset.reason = fieldValue(modal, 'reason');
            row.dataset.oldProduct = fieldValue(modal, 'oldProduct');
            row.dataset.newProduct = fieldValue(modal, 'newProduct');
            row.dataset.quantity = fieldValue(modal, 'quantity') || '1';
            attachActions(row.lastElementChild, 'exchange', 'exchange-detail');
            updateRowKey(row);
            closeModal(modal);
        };
    };

    const openReturnEditModal = (row) => {
        const code = rowText(row, 0);
        const product = row.dataset.product || 'Váy hoa nhí công chúa';
        const quantity = row.dataset.quantity || '1';
        const refund = row.dataset.refund || '220.000đ';
        const modal = showWorkModal('return-edit-modal', `Sửa phiếu trả ${code}`, `
            <div class="edit-summary">Cập nhật thông tin phiếu trả và chi tiết sản phẩm trả.</div>
            <div class="form-grid edit-grid">
                <div class="field"><label>Mã trả hàng</label><input data-field="code" value="${code}" disabled></div>
                <div class="field"><label>Mã hóa đơn</label><input data-field="invoiceCode" value="${rowText(row, 1)}"></div>
                <div class="field"><label>Ngày trả</label><input type="date" data-field="date" value="${rowText(row, 2)}"></div>
                <div class="field"><label>Nhân viên xử lý</label><input data-field="staff" value="${rowText(row, 4)}"></div>
                <div class="field full"><label>Lý do</label><input data-field="reason" value="${rowText(row, 3)}"></div>
            </div>
            <h3 class="section-title edit-section-title">Chi tiết sản phẩm trả</h3>
            <div class="form-grid edit-grid">
                <div class="field"><label>Sản phẩm</label><input data-field="product" value="${product}"></div>
                <div class="field"><label>Số lượng trả</label><input type="number" min="1" data-field="quantity" value="${quantity}"></div>
                <div class="field"><label>Tiền hoàn</label><input data-field="refund" value="${refund}"></div>
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary" data-save-edit="return">Lưu thay đổi</button>`);

        modal.querySelector('[data-save-edit="return"]').onclick = () => {
            row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(fieldValue(modal, 'invoiceCode'))}</td><td>${fieldValue(modal, 'date')}</td><td>${fieldValue(modal, 'reason')}</td><td>${fieldValue(modal, 'staff')}</td><td></td>`;
            row.dataset.product = fieldValue(modal, 'product');
            row.dataset.quantity = fieldValue(modal, 'quantity') || '1';
            row.dataset.refund = fieldValue(modal, 'refund') || '0đ';
            attachActions(row.lastElementChild, 'return', 'return-detail');
            updateRowKey(row);
            closeModal(modal);
        };
    };

    const openDeleteModal = (row, type) => {
        if (!row) return;
        const code = rowText(row, 0);
        const modal = showWorkModal('sale-delete-modal', `Xóa ${code}`, `
            <div class="delete-message">
                <i class='bx bx-error-circle'></i>
                <p>Bạn có chắc muốn xóa <strong>${code}</strong> không?</p>
                <span>Thao tác này chỉ xóa dữ liệu tạm trên giao diện hiện tại.</span>
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary danger" data-confirm-delete>Xóa</button>`);

        modal.querySelector('[data-confirm-delete]').onclick = () => {
            row.remove();
            if (type === 'invoice') {
                updateFirstStat(countRows('#invoice-table'));
                renderInvoicePagination();
            }
            if (type === 'exchange') updateFirstStat(countRows('#exchange-table'));
            if (type === 'return') updateFirstStat(countRows('#return-table'));
            closeModal(modal);
        };
    };
    const bindSearch = () => {
        const filters = {
            'invoice-page': ['#invoice-search', '#invoice-table'],
            'exchange-page': ['#exchange-search', '#exchange-table'],
            'return-page': ['#return-search', '#return-table']
        };

        const filter = filters[root.id];
        if (!filter) return;

        const searchInput = root.querySelector(filter[0]);
        const tableBody = root.querySelector(filter[1]);
        if (!searchInput || !tableBody) return;

        searchInput.addEventListener('input', () => {
            if (root.id === 'invoice-page') {
                invoiceCurrentPage = 1;
                renderInvoicePagination();
                return;
            }

            const value = normalize(searchInput.value);
            tableBody.querySelectorAll('tr').forEach((row) => {
                row.style.display = normalize(row.dataset.key).includes(value) ? '' : 'none';
            });
        });
    };

    /* =====================================================
       INVOICES - Thêm sản phẩm và tạo hóa đơn frontend tạm
       ===================================================== */
    const renderInvoiceDraftRow = (row, index) => {
        const product = row.dataset.product;
        const code = row.dataset.productCode || 'SP000';
        const quantity = Number(row.dataset.quantity || 1);
        const price = Number(row.dataset.price || 0);
        row.innerHTML = `
            <td>${index}</td>
            <td><a class="product-code-link" href="#">${code}</a></td>
            <td>${product}</td>
            <td>${quantity}</td>
            <td>${formatMoney(price)}</td>
            <td><strong>${formatMoney(price * quantity)}</strong></td>
            <td>
                <div class="draft-actions">
                    <button class="draft-action edit" data-edit-draft-product title="Sửa sản phẩm"><i class='bx bx-edit-alt'></i></button>
                    <button class="draft-action delete" data-delete-draft-product title="Xóa sản phẩm"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        `;
    };

    const refreshInvoiceDraftTable = (body) => {
        const rows = Array.from(body.querySelectorAll('tr')).filter((row) => !row.querySelector('.empty-row'));
        if (!rows.length) {
            body.innerHTML = '<tr><td colspan="7" class="empty-row">Chưa có sản phẩm. Thêm sản phẩm ở trên.</td></tr>';
            return;
        }
        rows.forEach((row, index) => renderInvoiceDraftRow(row, index + 1));
    };

    const addInvoiceProduct = () => {
        const modal = root.querySelector('#invoice-create');
        const productSelect = modal.querySelector('.add-product select');
        const qtyInput = modal.querySelector('.add-product input[type="number"]');
        const body = modal.querySelector('.sales-card tbody');
        if (!validSelect(productSelect)) {
            alert('Vui lòng chọn sản phẩm.');
            return;
        }

        const quantity = Math.max(1, Number(qtyInput.value || 1));
        const product = productSelect.value;
        const price = prices[product] || 100000;
        const row = document.createElement('tr');
        row.dataset.product = product;
        row.dataset.productCode = productCodes[product] || 'SP000';
        row.dataset.price = String(price);
        row.dataset.quantity = String(quantity);

        const empty = body.querySelector('.empty-row');
        if (empty) empty.closest('tr').remove();
        body.appendChild(row);
        refreshInvoiceDraftTable(body);
    };

    const openDraftEditModal = (row) => {
        if (!row) return;
        const productOptions = Object.keys(prices).map((name) => `<option ${row.dataset.product === name ? 'selected' : ''}>${name}</option>`).join('');
        const modal = showWorkModal('invoice-draft-edit-modal', 'Sửa sản phẩm trong hóa đơn', `
            <div class="form-grid edit-grid">
                <div class="field"><label>Sản phẩm</label><select data-field="product">${productOptions}</select></div>
                <div class="field"><label>Số lượng</label><input type="number" min="1" data-field="quantity" value="${row.dataset.quantity || 1}"></div>
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary" data-save-draft-product>Lưu thay đổi</button>`);

        modal.querySelector('[data-save-draft-product]').onclick = () => {
            const product = fieldValue(modal, 'product');
            const quantity = Math.max(1, Number(fieldValue(modal, 'quantity') || 1));
            row.dataset.product = product;
            row.dataset.productCode = productCodes[product] || 'SP000';
            row.dataset.price = String(prices[product] || 100000);
            row.dataset.quantity = String(quantity);
            refreshInvoiceDraftTable(row.closest('tbody'));
            closeModal(modal);
        };
    };

    const openDraftDeleteModal = (row) => {
        if (!row) return;
        const modal = showWorkModal('invoice-draft-delete-modal', 'Xóa sản phẩm khỏi hóa đơn', `
            <div class="delete-message">
                <i class='bx bx-error-circle'></i>
                <p>Bạn có chắc muốn xóa <strong>${row.dataset.product}</strong> khỏi hóa đơn không?</p>
                <span>Dòng sản phẩm này chỉ bị xóa khỏi form tạo hóa đơn hiện tại.</span>
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary danger" data-confirm-draft-delete>Xóa</button>`);

        modal.querySelector('[data-confirm-draft-delete]').onclick = () => {
            const body = row.closest('tbody');
            row.remove();
            refreshInvoiceDraftTable(body);
            closeModal(modal);
        };
    };

    const bindInvoiceDraftActions = () => {
        const modal = root.querySelector('#invoice-create');
        modal.addEventListener('click', (event) => {
            const editBtn = event.target.closest('[data-edit-draft-product]');
            const deleteBtn = event.target.closest('[data-delete-draft-product]');
            if (editBtn) openDraftEditModal(editBtn.closest('tr'));
            if (deleteBtn) openDraftDeleteModal(deleteBtn.closest('tr'));
        });
    };

    const createInvoice = () => {
        const modal = root.querySelector('#invoice-create');
        const customerSelect = modal.querySelector('.form-grid select');
        const dateInput = modal.querySelector('input[type="date"]');
        const productRows = Array.from(modal.querySelectorAll('.sales-card tbody tr')).filter((row) => !row.querySelector('.empty-row'));
        if (!validSelect(customerSelect)) {
            alert('Vui lòng chọn khách hàng.');
            return;
        }
        if (!productRows.length) {
            alert('Vui lòng thêm ít nhất một sản phẩm.');
            return;
        }

        const total = productRows.reduce((sum, row) => {
            return sum + Number(row.dataset.price || 0) * Number(row.dataset.quantity || 0);
        }, 0);
        const code = nextCode('#invoice-table', 'HD');
        const date = dateInput.value || today();
        const customer = customerSelect.value;
        const body = root.querySelector('#invoice-table');
        const row = document.createElement('tr');
        row.dataset.key = normalize(`${code} ${customer} Nguyễn Văn An Tiền mặt`);
        row.innerHTML = `<td><strong>${code}</strong></td><td>${date}</td><td>${customer}</td><td>Nguyễn Văn An</td><td class="green font-weight-600">${formatMoney(total)}</td><td>Tiền mặt</td><td></td>`;
        attachActions(row.lastElementChild, 'invoice', 'invoice-detail');
        body.prepend(row);

        updateFirstStat(countRows('#invoice-table'));
        invoiceCurrentPage = 1;
        renderInvoicePagination();
        closeModal(modal);
    };

    const bindInvoicePage = () => {
        hydrateActionCells('#invoice-table', 'invoice', 'invoice-detail');
        bindInvoicePagination();
        renderInvoicePagination();
        root.querySelector('#invoice-create .add-product .sales-btn.primary').addEventListener('click', addInvoiceProduct);
        root.querySelector('#invoice-create .modal-actions .sales-btn.primary').addEventListener('click', createInvoice);
        bindInvoiceDraftActions();
    };

    /* =====================================================
       EXCHANGES COMMON - Hiển thị sản phẩm đã chọn trong form
       ===================================================== */
    const addSelectedLine = (panel, type) => {
        const select = panel.querySelector('select');
        const qtyInput = panel.querySelector('input[type="number"]');
        if (!validSelect(select)) {
            alert('Vui lòng chọn sản phẩm.');
            return;
        }

        let list = panel.nextElementSibling;
        if (!list || !list.classList.contains('selected-items')) {
            list = document.createElement('div');
            list.className = 'selected-items';
            panel.after(list);
        }

        const quantity = Math.max(1, Number(qtyInput.value || 1));
        list.dataset.product = select.value;
        list.dataset.quantity = String(quantity);
        list.innerHTML = `<span>${type}: ${select.value}</span><strong>SL: ${quantity}</strong>`;
    };

    /* =====================================================
       EXCHANGES - Tạo phiếu đổi hàng frontend tạm
       ===================================================== */
    const updateExchangeCreateMode = () => {
        const modal = root.querySelector('#exchange-create');
        if (!modal) return;
        const selects = modal.querySelectorAll('.form-grid select');
        const typeSelect = selects[1];
        const newPanel = modal.querySelector('.swap-panel.new');
        const newTitle = newPanel?.previousElementSibling;
        const newSelectedLine = newPanel?.nextElementSibling?.classList.contains('selected-items') ? newPanel.nextElementSibling : null;
        const isReturn = typeSelect?.value === 'Trả hàng';

        [newTitle, newPanel, newSelectedLine].forEach((element) => {
            if (element) element.style.display = isReturn ? 'none' : '';
        });
    };

    const createExchange = () => {
        const modal = root.querySelector('#exchange-create');
        const selects = modal.querySelectorAll('.form-grid select');
        const invoiceSelect = selects[0];
        const typeSelect = selects[1];
        const dateInput = modal.querySelector('input[type="date"]');
        const noteInput = modal.querySelector('.form-grid input[type="text"]');
        const oldPanel = modal.querySelector('.swap-panel.old');
        const newPanel = modal.querySelector('.swap-panel.new');
        const oldSelect = oldPanel.querySelector('select');
        const newSelect = newPanel.querySelector('select');
        const isReturn = typeSelect?.value === 'Trả hàng';

        if (!validSelect(invoiceSelect)) {
            alert('Vui lòng chọn hóa đơn gốc.');
            return;
        }
        if (invoiceAlreadyProcessed(invoiceSelect.value)) {
            alert('Hóa đơn này đã có phiếu đổi/trả. Mỗi hóa đơn chỉ được đổi hoặc trả một lần.');
            return;
        }
        if (!validSelect(oldSelect)) {
            alert('Vui lòng chọn sản phẩm khách trả lại.');
            return;
        }
        if (!isReturn && !validSelect(newSelect)) {
            alert('Vui lòng chọn sản phẩm đổi mới.');
            return;
        }

        const code = nextCode('#exchange-table', 'DH');
        const invoiceCode = invoiceSelect.value;
        const date = dateInput.value || today();
        const reason = noteInput.value.trim() || (isReturn ? 'Trả hàng' : 'Đổi sang mẫu khác');
        const body = root.querySelector('#exchange-table');
        const row = document.createElement('tr');
        row.dataset.key = normalize(`${code} ${invoiceCode} Nguyễn Văn An ${reason}`);
        row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(invoiceCode)}</td><td>${date}</td><td>Nguyễn Văn An</td><td></td>`;
        attachActions(row.lastElementChild, 'exchange', 'exchange-detail');
        body.prepend(row);
        updateFirstStat(countRows('#exchange-table'));

        const detail = root.querySelector('#exchange-detail .sales-modal-body');
        detail.querySelector('.detail-title').textContent = `Chi tiết ${isReturn ? 'trả hàng' : 'đổi hàng'} ${code}`;
        detail.querySelector('.detail-grid').innerHTML = `<div class="detail-item"><span>Mã hóa đơn</span><strong>${invoiceCode}</strong></div><div class="detail-item"><span>Ngày ${isReturn ? 'trả' : 'đổi'}</span><strong>${date}</strong></div><div class="detail-item"><span>Nhân viên xử lý</span><strong>Nguyễn Văn An</strong></div><div class="detail-item"><span>Lý do</span><strong>${reason}</strong></div>`;
        detail.querySelector('tbody').innerHTML = `<tr><td>${oldSelect.value}</td><td>${isReturn ? '-' : newSelect.value}</td><td><strong>${Math.max(1, Number(oldPanel.querySelector('input').value || 1))}</strong></td></tr>`;
        closeModal(modal);
    };

    const bindExchangePage = () => {
        hydrateActionCells('#exchange-table', 'exchange', 'exchange-detail');
        const modal = root.querySelector('#exchange-create');
        const typeSelect = modal.querySelectorAll('.form-grid select')[1];
        root.querySelector('.swap-panel.old .sales-btn').addEventListener('click', () => addSelectedLine(root.querySelector('.swap-panel.old'), 'SP cũ'));
        root.querySelector('.swap-panel.new .sales-btn').addEventListener('click', () => addSelectedLine(root.querySelector('.swap-panel.new'), 'SP mới'));
        typeSelect.addEventListener('change', updateExchangeCreateMode);
        root.querySelector('#exchange-create .modal-actions .sales-btn.primary').addEventListener('click', createExchange);
        updateExchangeCreateMode();
    };

    /* =====================================================
       RETURNS - Tạo phiếu trả hàng frontend tạm
       ===================================================== */
    const updateReturnCreateMode = () => {
        const modal = root.querySelector('#return-create');
        if (!modal) return;
        const selects = modal.querySelectorAll('.form-grid select');
        const typeSelect = selects[1];
        const isExchange = typeSelect?.value === 'Đổi hàng';
        const exchangeTargets = modal.querySelectorAll('.return-exchange-target');
        const newPanel = modal.querySelector('.swap-panel.new.return-exchange-target');
        const newSelectedLine = newPanel?.nextElementSibling?.classList.contains('selected-items') ? newPanel.nextElementSibling : null;

        exchangeTargets.forEach((element) => {
            element.style.display = isExchange ? '' : 'none';
        });
        if (newSelectedLine) newSelectedLine.style.display = isExchange ? '' : 'none';
    };

    const createReturn = () => {
        const modal = root.querySelector('#return-create');
        const selects = modal.querySelectorAll('.form-grid select');
        const invoiceSelect = selects[0];
        const typeSelect = selects[1];
        const dateInput = modal.querySelector('input[type="date"]');
        const noteInput = modal.querySelector('.form-grid input[type="text"]');
        const panel = modal.querySelector('.return-panel');
        const newPanel = modal.querySelector('.swap-panel.new.return-exchange-target');
        const productSelect = panel.querySelector('select');
        const newProductSelect = newPanel?.querySelector('select');
        const qtyInput = panel.querySelector('input[type="number"]');
        const isExchange = typeSelect?.value === 'Đổi hàng';

        if (!validSelect(invoiceSelect)) {
            alert('Vui lòng chọn hóa đơn gốc.');
            return;
        }
        if (invoiceAlreadyProcessed(invoiceSelect.value)) {
            alert('Hóa đơn này đã có phiếu đổi/trả. Mỗi hóa đơn chỉ được đổi hoặc trả một lần.');
            return;
        }
        if (!validSelect(productSelect)) {
            alert('Vui lòng chọn sản phẩm khách trả lại.');
            return;
        }
        if (isExchange && !validSelect(newProductSelect)) {
            alert('Vui lòng chọn sản phẩm đổi mới.');
            return;
        }

        const code = nextCode('#return-table', 'TH');
        const invoiceCode = invoiceSelect.value;
        const date = dateInput.value || today();
        const reason = noteInput.value.trim() || (isExchange ? 'Đổi hàng' : 'Khách trả hàng');
        const product = productSelect.value;
        const newProduct = newProductSelect?.value || '-';
        const quantity = Math.max(1, Number(qtyInput.value || 1));
        const refund = (prices[product] || 100000) * quantity;
        const body = root.querySelector('#return-table');
        const row = document.createElement('tr');
        row.dataset.key = normalize(`${code} ${invoiceCode} ${reason} Nguyễn Văn An`);
        row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(invoiceCode)}</td><td>${date}</td><td>${reason}</td><td>Nguyễn Văn An</td><td></td>`;
        attachActions(row.lastElementChild, 'return', 'return-detail');
        body.prepend(row);
        updateFirstStat(countRows('#return-table'));

        const detail = root.querySelector('#return-detail .sales-modal-body');
        detail.querySelector('.detail-title').textContent = `Chi tiết ${isExchange ? 'đổi hàng' : 'trả hàng'} ${code}`;
        detail.querySelector('.detail-grid').innerHTML = `<div class="detail-item"><span>Mã hóa đơn</span><strong>${invoiceCode}</strong></div><div class="detail-item"><span>Ngày ${isExchange ? 'đổi' : 'trả'}</span><strong>${date}</strong></div><div class="detail-item"><span>Lý do</span><strong>${reason}</strong></div><div class="detail-item"><span>Nhân viên xử lý</span><strong>Nguyễn Văn An</strong></div>`;

        if (isExchange) {
            detail.querySelector('.section-title').textContent = 'Chi tiết đổi hàng';
            detail.querySelector('thead').innerHTML = '<tr><th>SP khách trả lại</th><th>SP đổi mới</th><th>Số lượng</th></tr>';
            detail.querySelector('tbody').innerHTML = `<tr><td>${product}</td><td>${newProduct}</td><td><strong>${quantity}</strong></td></tr>`;
            detail.querySelector('.total-line').style.display = 'none';
        } else {
            detail.querySelector('.section-title').textContent = 'Chi tiết sản phẩm trả';
            detail.querySelector('thead').innerHTML = '<tr><th>Sản phẩm</th><th>Số lượng trả</th><th>Tiền hoàn</th></tr>';
            detail.querySelector('tbody').innerHTML = `<tr><td>${product}</td><td><strong>${quantity}</strong></td><td class="red font-weight-600">${formatMoney(refund)}</td></tr>`;
            detail.querySelector('.total-line').style.display = '';
            detail.querySelector('.total-line').innerHTML = `Tổng tiền hoàn: <span class="red">${formatMoney(refund)}</span>`;
        }
        closeModal(modal);
    };

    const bindReturnPage = () => {
        hydrateActionCells('#return-table', 'return', 'return-detail');
        const modal = root.querySelector('#return-create');
        const typeSelect = modal.querySelectorAll('.form-grid select')[1];
        root.querySelector('.return-panel .sales-btn').addEventListener('click', () => addSelectedLine(root.querySelector('.return-panel'), 'SP trả'));
        const newPanelButton = root.querySelector('.swap-panel.new.return-exchange-target .sales-btn');
        if (newPanelButton) newPanelButton.addEventListener('click', () => addSelectedLine(root.querySelector('.swap-panel.new.return-exchange-target'), 'SP mới'));
        typeSelect.addEventListener('change', updateReturnCreateMode);
        root.querySelector('#return-create .modal-actions .sales-btn.primary').addEventListener('click', createReturn);
        updateReturnCreateMode();
    };

    /* =====================================================
       PAGE INIT - Gọi đúng phần xử lý theo trang đang load
       ===================================================== */
    bindSearch();

    if (root.id === 'invoice-page') bindInvoicePage();
    if (root.id === 'exchange-page') bindExchangePage();
    if (root.id === 'return-page') bindReturnPage();
};