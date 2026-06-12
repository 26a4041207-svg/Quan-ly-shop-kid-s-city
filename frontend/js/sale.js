window.initSalePage = function initSalePage(container) {
    const root = container.querySelector('.sales-page');
    if (!root || root.dataset.saleReady === 'true') return;
    root.dataset.saleReady = 'true';

    /* =====================================================
       COMMON DATA - Dữ liệu mẫu dùng để tính tiền frontend
       ===================================================== */
    const prices = {};

    const productCodes = {};

    const productDetails = {};

    // Dữ liệu mẫu của trang còn lại để chặn một hóa đơn bị đổi/trả nhiều lần khi từng trang được load riêng.
    const initialExchangeInvoiceCodes = [];
    const initialReturnInvoiceCodes = [];
    // Dữ liệu chi tiết hóa đơn dùng khi bấm mã hóa đơn ở trang đổi/trả hàng.
    const invoiceDetails = {};

    /* =====================================================
       COMMON HELPERS - Hàm tiện ích dùng chung nhiều trang
       ===================================================== */
    const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
    const today = () => new Date().toISOString().slice(0, 10);
    const normalize = (text) => (text || '').trim().toLowerCase();
    const validSelect = (select) => select && select.value && !select.value.includes('--');
    const invoiceProductOptions = Object.keys(prices).map((name) => ({
        name,
        code: productCodes[name] || 'SP000',
        price: prices[name] || 100000,
        ...(productDetails[name] || {})
    }));
    const invoiceCodes = () => Object.keys(invoiceDetails).sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));
    const normalizeInvoiceCode = (invoiceCode) => String(invoiceCode || '').trim().toUpperCase();
    const invoiceCodeKey = (invoiceCode) => invoiceCodes().find((code) => code.toUpperCase() === normalizeInvoiceCode(invoiceCode)) || normalizeInvoiceCode(invoiceCode);
    const invoiceItemsByCode = (invoiceCode) => invoiceDetails[invoiceCodeKey(invoiceCode)]?.items || [];
    const invoiceProductNamesByCode = (invoiceCode) => {
        const names = invoiceItemsByCode(invoiceCode).map((item) => item[0]).filter(Boolean);
        return Array.from(new Set(names));
    };
    const invoiceProductId = (invoiceCode, productName) => {
        const item = invoiceItemsByCode(invoiceCode).find((row) => row[0] === productName);
        return Number(item?.[5] || productDetails[productName]?.productId || 0);
    };
    const invoiceIdByCode = (invoiceCode) => Number(invoiceDetails[invoiceCodeKey(invoiceCode)]?.id || 0);

    const invoiceProductQuantity = (invoiceCode, productName) => {
        const item = invoiceItemsByCode(invoiceCode).find((row) => row[0] === productName);
        return Math.max(1, Number(item?.[2] || 1));
    };
    const resetSelectedLine = (panel) => {
        const line = panel?.nextElementSibling;
        if (line?.classList.contains('selected-items')) line.remove();
    };
    const renderInvoiceProductSelect = (select, invoiceCode) => {
        if (!select) return;

        const products = invoiceDetails[invoiceCodeKey(invoiceCode)] ? invoiceProductNamesByCode(invoiceCode) : [];
        const placeholder = products.length ? '-- Chọn SP --' : '-- Chọn hóa đơn trước --';
        select.innerHTML = `<option value="">${placeholder}</option>`;

        products.forEach((productName) => {
            const option = document.createElement('option');
            option.value = productName;
            option.textContent = productName;
            select.appendChild(option);
        });
    };
    const getInvoiceControl = (modal) => modal?.querySelector('[data-invoice-code]') || modal?.querySelectorAll('.form-grid select')[0];
    const getTypeSelect = (modal) => {
        const selects = Array.from(modal?.querySelectorAll('.form-grid select') || []);
        return selects.find((select) => ['Đổi hàng', 'Trả hàng'].includes(select.value)) || selects[1] || selects[0];
    };
    const getNoteInput = (modal) => Array.from(modal?.querySelectorAll('.form-grid input[type="text"]') || [])
        .find((input) => !input.matches('[data-invoice-code]'));
    const renderInvoiceCodeOptions = (modal, keyword = '') => {
        const combo = modal?.querySelector('[data-invoice-combobox]');
        const optionsBox = modal?.querySelector('[data-invoice-options]');
        if (!combo || !optionsBox) return;

        const normalizedKeyword = normalizeInvoiceCode(keyword);
        if (!normalizedKeyword) {
            combo.classList.remove('open');
            optionsBox.innerHTML = '';
            return;
        }

        const results = invoiceCodes().filter((code) => code.includes(normalizedKeyword));
        optionsBox.innerHTML = results.length
            ? results.map((code) => {
                const invoice = invoiceDetails[code] || {};
                return `<button type="button" class="invoice-option" data-invoice-option="${code}">
                    <strong>${code}</strong>
                    <span>${invoice.customer || ''} ${invoice.date ? '- ' + invoice.date : ''}</span>
                </button>`;
            }).join('')
            : '<div class="combo-empty">Không tìm thấy hóa đơn phù hợp.</div>';
        combo.classList.add('open');
    };

    const setInvoiceCode = (modal, code, panelSelector) => {
        const input = getInvoiceControl(modal);
        const combo = modal?.querySelector('[data-invoice-combobox]');
        if (!input) return;
        input.value = invoiceCodeKey(code);
        combo?.classList.remove('open');
        syncInvoiceProductPanel(modal, panelSelector);
    };

    const enhanceInvoiceControl = (modal, comboId, panelSelector) => {
        if (!modal) return null;
        let control = getInvoiceControl(modal);
        if (!control) return null;

        const field = control.closest('.field');
        const value = control.value && !String(control.value).includes('--') ? control.value : '';
        if (field && !field.querySelector('[data-invoice-combobox]')) {
            field.innerHTML = `
                <label>Mã hóa đơn gốc <span class="required">*</span></label>
                <div class="invoice-combobox" data-invoice-combobox id="${comboId}">
                    <input type="text" data-invoice-code placeholder="Nhập mã hóa đơn" autocomplete="off" value="${value}">
                    <div class="invoice-options" data-invoice-options></div>
                </div>
            `;
            control = field.querySelector('[data-invoice-code]');
        }

        const combo = field?.querySelector('[data-invoice-combobox]');
        const optionsBox = field?.querySelector('[data-invoice-options]');
        control.removeAttribute('list');
        control.addEventListener('input', () => {
            control.value = normalizeInvoiceCode(control.value);
            renderInvoiceCodeOptions(modal, control.value);
            syncInvoiceProductPanel(modal, panelSelector);
        });
        control.addEventListener('focus', () => renderInvoiceCodeOptions(modal, control.value));
        optionsBox?.addEventListener('click', (event) => {
            const option = event.target.closest('[data-invoice-option]');
            if (!option) return;
            setInvoiceCode(modal, option.dataset.invoiceOption, panelSelector);
        });
        document.addEventListener('click', (event) => {
            if (!combo?.contains(event.target)) combo?.classList.remove('open');
        });
        return control;
    };
    const refreshInvoiceDatalist = (modal) => {
        const control = getInvoiceControl(modal);
        if (control?.value) renderInvoiceCodeOptions(modal, control.value);
    };
    const mergeInvoicesFromApi = async () => {
        if (!window.kidCityApi) return false;

        try {
            const invoices = await window.kidCityApi.get('sales/invoices.php');
            invoices.forEach((invoice) => {
                if (!invoice.code) return;
                invoiceDetails[invoice.code] = mapInvoiceFromApi(invoice);
            });
            return true;
        } catch (error) {
            console.warn('Khong the tai hoa don tu API:', error.message);
            return false;
        }
    };
    const syncInvoiceProductPanel = (modal, panelSelector) => {
        const invoiceSelect = getInvoiceControl(modal);
        const panel = modal?.querySelector(panelSelector);
        const productSelect = panel?.querySelector('select');
        const quantityInput = panel?.querySelector('input[type="number"]');
        if (!invoiceSelect || !panel || !productSelect) return;

        renderInvoiceProductSelect(productSelect, invoiceSelect.value);
        resetSelectedLine(panel);
        if (quantityInput) {
            quantityInput.value = '1';
            quantityInput.removeAttribute('max');
        }

        productSelect.onchange = () => {
            const maxQuantity = invoiceProductQuantity(invoiceSelect.value, productSelect.value);
            if (quantityInput) {
                quantityInput.max = String(maxQuantity);
                quantityInput.value = String(Math.min(Math.max(1, Number(quantityInput.value || 1)), maxQuantity));
            }
            resetSelectedLine(panel);
        };
    };

    // Combobox sản phẩm trong form tạo hóa đơn: vừa gõ tìm kiếm, vừa chọn từ danh sách.
    const renderProductOptions = (modal, keyword = '') => {
        const optionsBox = modal.querySelector('[data-product-options]');
        if (!optionsBox) return;

        const normalizedKeyword = normalize(keyword);
        const results = invoiceProductOptions.filter((item) => {
            const searchable = `${item.code} ${item.name} ${item.category || ''} ${item.size || ''} ${item.color || ''} ${item.price || ''} ${item.stock || ''}`;
            return normalize(searchable).includes(normalizedKeyword);
        });

        optionsBox.innerHTML = results.length
            ? results.map((item) => `
                <button type="button" class="combo-option" data-product-name="${item.name}">
                    <span class="combo-main">
                        <span class="combo-title"><strong>${item.code}</strong> ${item.name}</span>
                        <span class="combo-meta">
                            <b>${item.category || 'Chưa phân loại'}</b>
                            <b>Size: ${item.size || '-'}</b>
                            <b>Màu: ${item.color || '-'}</b>
                            <b>SL: ${item.stock ?? '-'}</b>
                        </span>
                    </span>
                    <small>${formatMoney(item.price)}</small>
                </button>
            `).join('')
            : '<div class="combo-empty">Không tìm thấy sản phẩm phù hợp.</div>';
    };

    const setInvoiceProduct = (modal, productName) => {
        const input = modal.querySelector('[data-product-search]');
        const value = modal.querySelector('[data-product-value]');
        const combo = modal.querySelector('[data-product-combobox]');
        if (!input || !value || !combo) return;
        input.value = productName;
        value.value = productName;
        combo.classList.remove('open');
    };

    const initInvoiceProductCombobox = () => {
        const modal = root.querySelector('#invoice-create');
        if (!modal || modal.dataset.productComboReady === 'true') return;
        modal.dataset.productComboReady = 'true';

        const combo = modal.querySelector('[data-product-combobox]');
        const input = modal.querySelector('[data-product-search]');
        const value = modal.querySelector('[data-product-value]');
        const toggle = modal.querySelector('[data-product-toggle]');
        const optionsBox = modal.querySelector('[data-product-options]');
        if (!combo || !input || !value || !toggle || !optionsBox) return;

        renderProductOptions(modal);
        input.addEventListener('focus', () => {
            renderProductOptions(modal, input.value);
            combo.classList.add('open');
        });
        input.addEventListener('input', () => {
            value.value = '';
            renderProductOptions(modal, input.value);
            combo.classList.add('open');
        });
        toggle.addEventListener('click', () => {
            renderProductOptions(modal, input.value);
            combo.classList.toggle('open');
            input.focus();
        });
        optionsBox.addEventListener('click', (event) => {
            const option = event.target.closest('[data-product-name]');
            if (!option) return;
            setInvoiceProduct(modal, option.dataset.productName);
        });
        document.addEventListener('click', (event) => {
            if (!combo.contains(event.target)) combo.classList.remove('open');
        });
    };

    const selectedInvoiceProduct = (modal) => {
        const value = modal.querySelector('[data-product-value]')?.value.trim();
        const typed = modal.querySelector('[data-product-search]')?.value.trim();
        if (value && prices[value]) return value;
        const exactMatch = invoiceProductOptions.find((item) => normalize(item.name) === normalize(typed) || normalize(item.code) === normalize(typed));
        return exactMatch?.name || '';
    };
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
        const currentRole = localStorage.getItem('currentRole') || 'admin';
        const staffBlockedDeletes = ['invoice', 'exchange', 'return'];
        const canDelete = !(currentRole === 'staff' && staffBlockedDeletes.includes(type));
        const deleteButton = canDelete
            ? `<button class="action-btn delete" data-delete="${type}" title="Xóa"><i class='bx bx-trash'></i></button>`
            : '';

        cell.innerHTML = `
            <div class="action-group">
                <button class="action-btn view" data-open="${detailId}" title="Xem chi tiết"><i class='bx bx-show'></i></button>
                <button class="action-btn edit" data-edit="${type}" title="Sửa"><i class='bx bx-edit-alt'></i></button>
                ${deleteButton}
            </div>
        `;
    };
    const rowText = (row, index) => row.children[index]?.textContent.trim() || '';
    const searchableRowText = (row) => normalize(`${row.dataset.key || ''} ${row.textContent || ''}`);
    const invoiceLink = (code) => `<a class="invoice-code-link" href="#" style="color: black; text-decoration: underline;">${code}</a>`;

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

    const mapInvoiceFromApi = (invoice) => ({
        id: Number(invoice.id || 0),
        customer: invoice.customer_name || '',
        staff: invoice.staff_name || '',
        date: invoice.invoice_date || invoice.created_at || '',
        payment: invoice.payment_method || '',
        note: invoice.note || 'Không có',
        total: formatMoney(invoice.total),
        items: (invoice.items || []).map((item) => [
            item.product_name || item.product_code || 'Sản phẩm',
            formatMoney(item.price),
            String(item.quantity || 1),
            formatMoney(item.discount),
            formatMoney(item.line_total),
            Number(item.product_id || 0),
            Number(item.price || 0)
        ])
    });

    const showTableLoading = (selector, colspan) => {
        const body = root.querySelector(selector);
        if (body) body.innerHTML = `<tr><td colspan="${colspan}" class="empty-row">Đang tải dữ liệu từ database...</td></tr>`;
    };

    const showTableError = (selector, colspan) => {
        const body = root.querySelector(selector);
        if (body) body.innerHTML = `<tr><td colspan="${colspan}" class="empty-row">Không tải được dữ liệu từ database.</td></tr>`;
    };

    const loadInvoiceFormDataFromApi = async () => {
        if (!window.kidCityApi || root.id !== 'invoice-page') return;
        try {
            const [customers, products] = await Promise.all([
                window.kidCityApi.get('customers/index.php'),
                window.kidCityApi.get('products/items.php')
            ]);

            const customerSelect = root.querySelector('#invoice-create .form-grid select');
            if (customerSelect && Array.isArray(customers)) {
                customerSelect.innerHTML = '<option value="">-- Chọn khách hàng --</option>';
                customers.forEach((customer) => {
                    const option = document.createElement('option');
                    option.value = customer.name || '';
                    option.textContent = customer.name || '';
                    option.dataset.customerId = customer.id || '';
                    customerSelect.appendChild(option);
                });
            }

            if (Array.isArray(products)) {
                invoiceProductOptions.splice(0, invoiceProductOptions.length);
                Object.keys(prices).forEach((key) => delete prices[key]);
                Object.keys(productCodes).forEach((key) => delete productCodes[key]);
                Object.keys(productDetails).forEach((key) => delete productDetails[key]);
                products.forEach((product) => {
                    if (!product.name) return;
                    const price = Number(product.price || 0);
                    prices[product.name] = price;
                    productCodes[product.name] = product.code || '';
                    productDetails[product.name] = {
                        productId: product.id,
                        category: product.category_name || '',
                        size: product.size || '',
                        color: product.color || '',
                        stock: Number(product.stock || 0)
                    };
                    invoiceProductOptions.push({
                        id: product.id,
                        name: product.name,
                        code: product.code || '',
                        price,
                        category: product.category_name || '',
                        size: product.size || '',
                        color: product.color || '',
                        stock: Number(product.stock || 0)
                    });
                });
            }
        } catch (error) {
            console.warn('Khong the tai khach hang/san pham tu API:', error.message);
        }
    };

    const loadInvoiceTableFromApi = async () => {
        if (!window.kidCityApi || root.id !== 'invoice-page') return;
        try {
            const invoices = await window.kidCityApi.get('sales/invoices.php');
            const body = root.querySelector('#invoice-table');
            if (!body || !Array.isArray(invoices)) return;
            body.innerHTML = '';
            let cashCount = 0;
            let transferCount = 0;
            let totalRevenue = 0;
            invoices.forEach((invoice) => {
                if (invoice.code) invoiceDetails[invoice.code] = mapInvoiceFromApi(invoice);
                const payment = invoice.payment_method || '';
                if (normalize(payment).includes('tiền mặt')) cashCount += 1;
                if (normalize(payment).includes('chuyển khoản')) transferCount += 1;
                totalRevenue += Number(invoice.total || 0);
                const row = document.createElement('tr');
                row.dataset.key = normalize(`${invoice.code || ''} ${invoice.customer_name || ''} ${invoice.staff_name || ''} ${payment}`);
                row.innerHTML = `<td><strong>${invoice.code || ''}</strong></td><td>${invoice.invoice_date || ''}</td><td>${invoice.customer_name || ''}</td><td>${invoice.staff_name || ''}</td><td class="green font-weight-600">${formatMoney(invoice.total)}</td><td>${payment}</td><td></td>`;
                attachActions(row.lastElementChild, 'invoice', 'invoice-detail');
                body.appendChild(row);
            });
            const stats = root.querySelectorAll('.sales-stat strong');
            if (stats[0]) stats[0].textContent = String(invoices.length);
            if (stats[1]) stats[1].textContent = formatMoney(totalRevenue);
            if (stats[2]) stats[2].textContent = String(cashCount);
            if (stats[3]) stats[3].textContent = String(transferCount);
            invoiceCurrentPage = 1;
            renderInvoicePagination();
        } catch (error) {
            console.warn('Khong the tai hoa don tu API:', error.message);
            showTableError('#invoice-table', 7);
        }
    };

    const loadExchangeTableFromApi = async () => {
        if (!window.kidCityApi || root.id !== 'exchange-page') return;
        try {
            const exchanges = await window.kidCityApi.get('sales/exchanges.php');
            const body = root.querySelector('#exchange-table');
            if (!body || !Array.isArray(exchanges)) return;
            body.innerHTML = '';
            let totalRefund = 0;
            exchanges.forEach((item) => {
                totalRefund += Number(item.refund_amount || 0);
                const row = document.createElement('tr');
                row.dataset.key = normalize(`${item.code || ''} ${item.invoice_code || ''} ${item.staff_name || ''} ${item.reason || ''}`);
                row.dataset.refund = formatMoney(item.refund_amount || 0);
                row.dataset.reason = item.reason || '';
                row.dataset.oldProduct = item.old_product_name || '';
                row.dataset.newProduct = item.new_product_name || '-';
                row.dataset.quantity = String(item.quantity || 1);
                row.dataset.updatedAt = item.updated_at || '';
                row.innerHTML = `<td><strong>${item.code || ''}</strong></td><td>${invoiceLink(item.invoice_code || '')}</td><td>${item.exchange_date || ''}</td><td>${item.reason || ''}</td><td>${item.staff_name || ''}</td><td></td>`;
                attachActions(row.lastElementChild, 'exchange', 'exchange-detail');
                body.appendChild(row);
            });
            updateFirstStat(exchanges.length);
            const stats = root.querySelectorAll('.sales-stat strong');
            if (stats[1]) stats[1].textContent = formatMoney(totalRefund);
        } catch (error) {
            console.warn('Khong the tai phieu doi hang tu API:', error.message);
            showTableError('#exchange-table', 6);
        }
    };

    const loadReturnTableFromApi = async () => {
        if (!window.kidCityApi || root.id !== 'return-page') return;
        try {
            const returns = await window.kidCityApi.get('sales/returns.php');
            const body = root.querySelector('#return-table');
            if (!body || !Array.isArray(returns)) return;
            body.innerHTML = '';
            let totalRefund = 0;
            returns.forEach((item) => {
                totalRefund += Number(item.refund_amount || 0);
                const row = document.createElement('tr');
                row.dataset.key = normalize(`${item.code || ''} ${item.invoice_code || ''} ${item.reason || ''} ${item.staff_name || ''}`);
                row.dataset.product = item.product_name || '';
                row.dataset.quantity = String(item.quantity || 1);
                row.dataset.refund = formatMoney(item.refund_amount);
                row.dataset.updatedAt = item.updated_at || '';
                row.innerHTML = `<td><strong>${item.code || ''}</strong></td><td>${invoiceLink(item.invoice_code || '')}</td><td>${item.return_date || ''}</td><td>${item.reason || ''}</td><td>${item.staff_name || ''}</td><td></td>`;
                attachActions(row.lastElementChild, 'return', 'return-detail');
                body.appendChild(row);
            });
            updateFirstStat(returns.length);
            const stats = root.querySelectorAll('.sales-stat strong');
            if (stats[1]) stats[1].textContent = formatMoney(totalRefund);
        } catch (error) {
            console.warn('Khong the tai phieu tra hang tu API:', error.message);
            showTableError('#return-table', 6);
        }
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

    const syncExchangeDetailFromRow = (row) => {
        const detail = root.querySelector('#exchange-detail .sales-modal-body');
        if (!detail || !row) return;
        const code = rowText(row, 0);
        const invoiceCode = rowText(row, 1);
        detail.querySelector('.detail-title').textContent = `Chi tiết đổi hàng ${code}`;
        detail.querySelector('.detail-grid').innerHTML = `
            <div class="detail-item"><span>Mã hóa đơn</span><strong>${invoiceCode}</strong></div>
            <div class="detail-item"><span>Ngày đổi</span><strong>${rowText(row, 2)}</strong></div>
            <div class="detail-item"><span>Lý do</span><strong>${rowText(row, 3) || row.dataset.reason || 'Không có'}</strong></div>
            <div class="detail-item"><span>Nhân viên xử lý</span><strong>${rowText(row, 4)}</strong></div>
            <div class="detail-item"><span>Ngày cập nhật</span><strong>${row.dataset.updatedAt || 'Chưa cập nhật'}</strong></div>
        `;
        detail.querySelector('tbody').innerHTML = `
            <tr>
                <td>${row.dataset.oldProduct || '-'}</td>
                <td>${row.dataset.newProduct || '-'}</td>
                <td><strong>${row.dataset.quantity || '1'}</strong></td>
            </tr>
        `;
    };

    const syncReturnDetailFromRow = (row) => {
        const detail = root.querySelector('#return-detail .sales-modal-body');
        if (!detail || !row) return;
        const code = rowText(row, 0);
        const invoiceCode = rowText(row, 1);
        const refund = row.dataset.refund || '0đ';
        detail.querySelector('.detail-title').textContent = `Chi tiết trả hàng ${code}`;
        detail.querySelector('.detail-grid').innerHTML = `
            <div class="detail-item"><span>Mã hóa đơn</span><strong>${invoiceCode}</strong></div>
            <div class="detail-item"><span>Ngày trả</span><strong>${rowText(row, 2)}</strong></div>
            <div class="detail-item"><span>Lý do</span><strong>${rowText(row, 3) || 'Không có'}</strong></div>
            <div class="detail-item"><span>Nhân viên xử lý</span><strong>${rowText(row, 4)}</strong></div>
            <div class="detail-item"><span>Ngày cập nhật</span><strong>${row.dataset.updatedAt || 'Chưa cập nhật'}</strong></div>
        `;
        detail.querySelector('tbody').innerHTML = `
            <tr>
                <td>${row.dataset.product || '-'}</td>
                <td><strong>${row.dataset.quantity || '1'}</strong></td>
                <td class="red font-weight-600">${refund}</td>
            </tr>
        `;
        detail.querySelector('.total-line').innerHTML = `Tổng tiền hoàn: <span class="red">${refund}</span>`;
    };

    const openInvoiceDetailByCode = (code) => {
        const invoice = invoiceDetails[code];
        if (!invoice) {
            alert('Không tìm thấy chi tiết hóa đơn ' + code + '.');
            return;
        }

        let modal = root.querySelector('#linked-invoice-detail');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'sales-modal';
            modal.id = 'linked-invoice-detail';
            modal.addEventListener('click', (event) => {
                if (event.target === modal) closeModal(modal);
            });
            root.appendChild(modal);
        }

        const rows = invoice.items.map((item) => `
            <tr>
                <td>${item[0]}</td>
                <td>${item[1]}</td>
                <td>${item[2]}</td>
                <td>${item[3]}</td>
                <td><strong>${item[4]}</strong></td>
            </tr>
        `).join('');

        modal.innerHTML = `
            <div class="sales-dialog detail">
                <div class="sales-modal-body">
                    <h2 class="detail-title">Chi tiết hóa đơn ${code}</h2>
                    <div class="detail-grid">
                        <div class="detail-item"><span>Khách hàng</span><strong>${invoice.customer}</strong></div>
                        <div class="detail-item"><span>Nhân viên</span><strong>${invoice.staff}</strong></div>
                        <div class="detail-item"><span>Ngày lập</span><strong>${invoice.date}</strong></div>
                        <div class="detail-item"><span>Phương thức thanh toán</span><strong>${invoice.payment}</strong></div>
                        <div class="detail-item"><span>Ghi chú</span><strong>${invoice.note}</strong></div>
                    </div>
                    <h3 class="section-title">Chi tiết sản phẩm</h3>
                    <table class="sales-table">
                        <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Giảm giá</th><th>Thành tiền</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="total-line">Tổng tiền: <span class="green">${invoice.total}</span></div>
                    <button class="sales-btn primary block" data-close>Đóng</button>
                </div>
            </div>
        `;
        modal.classList.add('active');
    };

    root.addEventListener('click', (event) => {
        const invoiceCodeLink = event.target.closest('.invoice-code-link');
        if (invoiceCodeLink && root.contains(invoiceCodeLink)) {
            event.preventDefault();
            openInvoiceDetailByCode(invoiceCodeLink.textContent.trim());
            return;
        }

        const openBtn = event.target.closest('[data-open]');
        if (openBtn && root.contains(openBtn)) {
            const row = openBtn.closest('tr');
            if (openBtn.dataset.open === 'exchange-detail') syncExchangeDetailFromRow(row);
            if (openBtn.dataset.open === 'return-detail') syncReturnDetailFromRow(row);
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
            const staffBlockedDeletes = ['invoice', 'exchange', 'return'];
            if (localStorage.getItem('currentRole') === 'staff' && staffBlockedDeletes.includes(deleteBtn.dataset.delete)) return;
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
            return searchableRowText(row).includes(keyword);
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
        const invoice = invoiceDetails[code] || {};
        const detailRows = (invoice.items || []).length
            ? invoice.items.map((item) => `
                <tr>
                    <td>${item[0] || ''}</td>
                    <td>${item[1] || '0đ'}</td>
                    <td>${item[2] || '1'}</td>
                    <td><strong>${item[4] || item[3] || '0đ'}</strong></td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" class="empty-row">Chưa có chi tiết sản phẩm.</td></tr>';
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
            <table class="sales-table"><thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead><tbody>${detailRows}</tbody></table>
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
                <div class="field"><label>Mã đổi hàng</label><input data-field="code" value="${code}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Mã hóa đơn</label><input data-field="invoiceCode" value="${rowText(row, 1)}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Ngày đổi</label><input type="date" data-field="date" value="${rowText(row, 2)}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Nhân viên xử lý</label><input data-field="staff" value="${rowText(row, 3)}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field full"><label>Lý do</label><input data-field="reason" value="${reason}"></div>
            </div>
            <h3 class="section-title edit-section-title" style="display:flex; justify-content:space-between; align-items:center;">Chi tiết đổi hàng <button class="sales-btn primary" data-add-exchange-product type="button" style="padding: 4px 8px; font-size: 0.9em;"><i class='bx bx-plus'></i></button></h3>
            <div class="product-list-container">
                <div class="form-grid edit-grid product-row" style="position: relative; padding-right: 40px; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                    <div class="field"><label>SP cũ</label><input data-field="oldProduct" value="${oldProduct}"></div>
                    <div class="field"><label>SP mới</label><input data-field="newProduct" value="${newProduct}"></div>
                    <div class="field"><label>Số lượng</label><input type="number" min="1" data-field="quantity" value="${quantity}"></div>
                    <button class="action-btn delete" data-remove-row type="button" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: none; color: #ff4d4f; font-size: 1.2em; cursor: pointer;"><i class='bx bx-trash'></i></button>
                </div>
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary" data-save-edit="exchange">Lưu thay đổi</button>`);

        modal.querySelector('[data-add-exchange-product]').onclick = () => {
            const container = modal.querySelector('.product-list-container');
            const newRow = document.createElement('div');
            newRow.className = 'form-grid edit-grid product-row';
            newRow.style.cssText = 'position: relative; padding-right: 40px; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 10px;';
            newRow.innerHTML = `
                <div class="field"><label>SP cũ</label><input data-field="oldProduct" value=""></div>
                <div class="field"><label>SP mới</label><input data-field="newProduct" value=""></div>
                <div class="field"><label>Số lượng</label><input type="number" min="1" data-field="quantity" value="1"></div>
                <button class="action-btn delete" data-remove-row type="button" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: none; color: #ff4d4f; font-size: 1.2em; cursor: pointer;"><i class='bx bx-trash'></i></button>
            `;
            container.appendChild(newRow);
        };

        modal.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('[data-remove-row]');
            if (removeBtn) {
                removeBtn.closest('.product-row').remove();
            }
        });

        modal.querySelector('[data-save-edit="exchange"]').onclick = () => {
            const firstRow = modal.querySelector('.product-row');
            row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(fieldValue(modal, 'invoiceCode'))}</td><td>${fieldValue(modal, 'date')}</td><td>${fieldValue(modal, 'reason')}</td><td>${fieldValue(modal, 'staff')}</td><td></td>`;
            row.dataset.reason = fieldValue(modal, 'reason');
            if (firstRow) {
                row.dataset.oldProduct = firstRow.querySelector('[data-field="oldProduct"]').value;
                row.dataset.newProduct = firstRow.querySelector('[data-field="newProduct"]').value;
                row.dataset.quantity = firstRow.querySelector('[data-field="quantity"]').value || '1';
            }
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
                <div class="field"><label>Mã trả hàng</label><input data-field="code" value="${code}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Mã hóa đơn</label><input data-field="invoiceCode" value="${rowText(row, 1)}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Ngày trả</label><input type="date" data-field="date" value="${rowText(row, 2)}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Nhân viên xử lý</label><input data-field="staff" value="${rowText(row, 4)}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field full"><label>Lý do</label><input data-field="reason" value="${rowText(row, 3)}"></div>
            </div>
            <h3 class="section-title edit-section-title" style="display:flex; justify-content:space-between; align-items:center;">Chi tiết sản phẩm trả <button class="sales-btn primary" data-add-return-product type="button" style="padding: 4px 8px; font-size: 0.9em;"><i class='bx bx-plus'></i></button></h3>
            <div class="product-list-container">
                <div class="form-grid edit-grid product-row" style="position: relative; padding-right: 40px; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                    <div class="field"><label>Sản phẩm</label><input data-field="product" value="${product}"></div>
                    <div class="field"><label>Số lượng trả</label><input type="number" min="1" data-field="quantity" value="${quantity}"></div>
                    <div class="field"><label>Tiền hoàn</label><input data-field="refund" value="${refund}"></div>
                    <button class="action-btn delete" data-remove-row type="button" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: none; color: #ff4d4f; font-size: 1.2em; cursor: pointer;"><i class='bx bx-trash'></i></button>
                </div>
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary" data-save-edit="return">Lưu thay đổi</button>`);

        modal.querySelector('[data-add-return-product]').onclick = () => {
            const container = modal.querySelector('.product-list-container');
            const newRow = document.createElement('div');
            newRow.className = 'form-grid edit-grid product-row';
            newRow.style.cssText = 'position: relative; padding-right: 40px; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 10px;';
            newRow.innerHTML = `
                <div class="field"><label>Sản phẩm</label><input data-field="product" value=""></div>
                <div class="field"><label>Số lượng trả</label><input type="number" min="1" data-field="quantity" value="1"></div>
                <div class="field"><label>Tiền hoàn</label><input data-field="refund" value="0đ"></div>
                <button class="action-btn delete" data-remove-row type="button" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: none; color: #ff4d4f; font-size: 1.2em; cursor: pointer;"><i class='bx bx-trash'></i></button>
            `;
            container.appendChild(newRow);
        };

        modal.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('[data-remove-row]');
            if (removeBtn) {
                removeBtn.closest('.product-row').remove();
            }
        });

        modal.querySelector('[data-save-edit="return"]').onclick = () => {
            const firstRow = modal.querySelector('.product-row');
            row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(fieldValue(modal, 'invoiceCode'))}</td><td>${fieldValue(modal, 'date')}</td><td>${fieldValue(modal, 'reason')}</td><td>${fieldValue(modal, 'staff')}</td><td></td>`;
            if (firstRow) {
                row.dataset.product = firstRow.querySelector('[data-field="product"]').value;
                row.dataset.quantity = firstRow.querySelector('[data-field="quantity"]').value || '1';
                row.dataset.refund = firstRow.querySelector('[data-field="refund"]').value || '0đ';
            }
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
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary danger" data-confirm-delete>Xóa</button>`);

        modal.querySelector('[data-confirm-delete]').onclick = () => {
            row.remove();
            if (type === 'invoice') {
                updateFirstStat(countRows('#invoice-table'));
                renderInvoicePagination();
            }
            if (type === 'exchange') {
                updateFirstStat(countRows('#exchange-table'));
                const stats = root.querySelectorAll('.sales-stat strong');
                if (stats[1]) {
                    const totalRefund = Array.from(root.querySelectorAll('#exchange-table tr')).reduce((sum, r) => sum + moneyNumber(r.dataset.refund || '0'), 0);
                    stats[1].textContent = formatMoney(totalRefund);
                }
            }
            if (type === 'return') {
                updateFirstStat(countRows('#return-table'));
                const stats = root.querySelectorAll('.sales-stat strong');
                if (stats[1]) {
                    const totalRefund = Array.from(root.querySelectorAll('#return-table tr')).reduce((sum, r) => sum + moneyNumber(r.dataset.refund || '0'), 0);
                    stats[1].textContent = formatMoney(totalRefund);
                }
            }
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
                row.style.display = searchableRowText(row).includes(value) ? '' : 'none';
            });
        });
    };

    /* =====================================================
       INVOICES - Thêm sản phẩm và tạo hóa đơn frontend tạm
       ===================================================== */
    const renderInvoiceDraftRow = (row, index) => {
        const product = row.dataset.product;
        const code = row.dataset.productCode || 'SP000';
        const detail = productDetails[product] || {};
        const quantity = Number(row.dataset.quantity || 1);
        const price = Number(row.dataset.price || 0);
        row.innerHTML = `
            <td>${index}</td>
            <td><a class="product-code-link" href="#">${code}</a></td>
            <td>
                <strong>${product}</strong>
                <div class="draft-product-meta">
                    Size: ${detail.size || '-'} · Màu: ${detail.color || '-'} · Tồn: ${detail.stock ?? '-'}
                </div>
            </td>
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
            updateInvoiceSummary(body.closest('#invoice-create'));
            return;
        }
        rows.forEach((row, index) => renderInvoiceDraftRow(row, index + 1));
        updateInvoiceSummary(body.closest('#invoice-create'));
    };

    const updateInvoiceSummary = (modal) => {
        if (!modal) return;
        const productRows = Array.from(modal.querySelectorAll('.sales-card tbody tr')).filter((row) => !row.querySelector('.empty-row'));
        const subtotal = productRows.reduce((sum, row) => sum + Number(row.dataset.price || 0) * Number(row.dataset.quantity || 0), 0);
        const discountInput = modal.querySelector('[data-invoice-discount]');
        const subtotalEl = modal.querySelector('[data-invoice-subtotal]');
        const totalEl = modal.querySelector('[data-invoice-total]');

        if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
        if (discountInput) {
            discountInput.disabled = false;
            discountInput.value = subtotal > 1000000 ? formatMoney(Math.round(subtotal * 0.1)) : '0đ';
        }

        const discount = Math.min(moneyNumber(discountInput?.value), subtotal);
        if (totalEl) totalEl.textContent = formatMoney(Math.max(0, subtotal - discount));
    };

    const addInvoiceProduct = () => {
        const modal = root.querySelector('#invoice-create');
        const product = selectedInvoiceProduct(modal);
        const qtyInput = modal.querySelector('.add-product input[type="number"]');
        const body = modal.querySelector('.sales-card tbody');
        if (!product) {
            alert('Vui lòng chọn sản phẩm trong danh sách gợi ý.');
            modal.querySelector('[data-product-search]')?.focus();
            return;
        }

        const quantity = Math.max(1, Number(qtyInput.value || 1));
        const price = prices[product] || 100000;
        const row = document.createElement('tr');
        const productInfo = invoiceProductOptions.find((item) => item.name === product) || {};
        row.dataset.product = product;
        row.dataset.productId = productInfo.id || productDetails[product]?.productId || '';
        row.dataset.productCode = productCodes[product] || 'SP000';
        row.dataset.price = String(price);
        row.dataset.quantity = String(quantity);

        const empty = body.querySelector('.empty-row');
        if (empty) empty.closest('tr').remove();
        body.appendChild(row);
        refreshInvoiceDraftTable(body);

        modal.querySelector('[data-product-search]').value = '';
        modal.querySelector('[data-product-value]').value = '';
        renderProductOptions(modal);
        qtyInput.value = '1';
        modal.querySelector('[data-product-search]').focus();
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

    const createInvoice = async () => {
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

        updateInvoiceSummary(modal);
        const total = moneyNumber(modal.querySelector('[data-invoice-total]')?.textContent);
        if (window.kidCityApi) {
            try {
                const selectedCustomer = customerSelect.selectedOptions[0];
                await window.kidCityApi.post('sales/invoices.php', {
                    customer_id: Number(selectedCustomer?.dataset.customerId || 0),
                    invoice_date: dateInput.value || today(),
                    payment_method: 'Tiền mặt',
                    discount: moneyNumber(modal.querySelector('[data-invoice-discount]')?.value),
                    items: productRows.map((row) => ({
                        product_id: Number(row.dataset.productId || 0),
                        quantity: Number(row.dataset.quantity || 1),
                        price: Number(row.dataset.price || 0),
                        discount: 0
                    }))
                });
                closeModal(modal);
                await loadInvoiceTableFromApi();
                await mergeInvoicesFromApi();
                return;
            } catch (error) {
                alert(error.message || 'Không thể tạo hóa đơn.');
                return;
            }
        }

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

    const openInvoiceCustomerModal = () => {
        const invoiceModal = root.querySelector('#invoice-create');
        const customerSelect = invoiceModal?.querySelector('.form-grid select');
        const modal = showWorkModal('invoice-customer-create-modal', 'Thêm khách hàng', `
            <div class="form-grid edit-grid customer-create-grid">
                <div class="field full">
                    <label>Họ tên khách hàng <span class="required">*</span></label>
                    <input type="text" data-field="customerName" placeholder="Nhập họ tên khách hàng">
                </div>
                <div class="field full">
                    <label>Số điện thoại <span class="required">*</span></label>
                    <input type="text" data-field="customerPhone" placeholder="Nhập số điện thoại">
                </div>
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary" data-save-invoice-customer>Lưu</button>`);

        modal.querySelector('[data-save-invoice-customer]').onclick = () => {
            const name = fieldValue(modal, 'customerName');
            const phone = fieldValue(modal, 'customerPhone');
            if (!name || !phone) {
                alert('Vui lòng nhập đầy đủ tên và số điện thoại khách hàng.');
                return;
            }

            if (customerSelect) {
                let option = Array.from(customerSelect.options).find((item) => normalize(item.value) === normalize(name));
                if (!option) {
                    option = document.createElement('option');
                    option.value = name;
                    option.textContent = name;
                    option.dataset.phone = phone;
                    customerSelect.appendChild(option);
                }
                customerSelect.value = name;
            }

            closeModal(modal);
        };
    };
    const bindInvoicePage = () => {
        showTableLoading('#invoice-table', 7);
        bindInvoicePagination();
        renderInvoicePagination();
        loadInvoiceFormDataFromApi();
        loadInvoiceTableFromApi();
        initInvoiceProductCombobox();
        root.querySelector('#invoice-create .add-product .sales-btn.primary').addEventListener('click', addInvoiceProduct);
        root.querySelector('#invoice-create [data-invoice-discount]')?.addEventListener('input', (event) => {
            updateInvoiceSummary(event.target.closest('#invoice-create'));
        });
        root.querySelector('#invoice-create [data-invoice-discount]')?.addEventListener('blur', (event) => {
            event.target.value = formatMoney(moneyNumber(event.target.value));
            updateInvoiceSummary(event.target.closest('#invoice-create'));
        });
        updateInvoiceSummary(root.querySelector('#invoice-create'));
        root.querySelector('#invoice-create .modal-actions .sales-btn.primary').addEventListener('click', createInvoice);
        root.querySelector('[data-add-invoice-customer]')?.addEventListener('click', (event) => {
            event.preventDefault();
            openInvoiceCustomerModal();
        });
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

        const maxQuantity = Number(qtyInput.max || 0);
        const requestedQuantity = Math.max(1, Number(qtyInput.value || 1));
        const quantity = maxQuantity > 0 ? Math.min(requestedQuantity, maxQuantity) : requestedQuantity;
        qtyInput.value = String(quantity);
        list.dataset.product = select.value;
        list.dataset.quantity = String(quantity);
        list.innerHTML = `<span>${type}: ${select.value}</span><strong>SL: ${quantity}</strong>`;
    };

    /* =====================================================
       EXCHANGES - Tạo phiếu đổi hàng frontend tạm
       ===================================================== */
    const updateExchangeRefund = () => {
        const modal = root.querySelector('#exchange-create');
        if (!modal) return;
        const returnSelect = modal.querySelector('.swap-panel.return-only select');
        const returnQty = modal.querySelector('.swap-panel.return-only input[type="number"]');
        const oldSelect = modal.querySelector('.swap-panel.old select');
        const oldQty = modal.querySelector('.swap-panel.old input[type="number"]');
        const newSelect = modal.querySelector('.swap-panel.new select');
        const newQty = modal.querySelector('.swap-panel.new input[type="number"]');
        
        let refund = 0;
        if (validSelect(returnSelect)) refund += (prices[returnSelect.value] || 100000) * Math.max(1, Number(returnQty?.value || 1));
        if (validSelect(oldSelect)) refund += (prices[oldSelect.value] || 100000) * Math.max(1, Number(oldQty?.value || 1));
        if (validSelect(newSelect)) refund -= (prices[newSelect.value] || 100000) * Math.max(1, Number(newQty?.value || 1));
        
        const totalRefundEl = modal.querySelector('#exchange-total-refund');
        if (totalRefundEl) {
            totalRefundEl.textContent = formatMoney(refund);
            totalRefundEl.className = refund >= 0 ? 'green font-weight-600' : 'red font-weight-600';
        }
    };

    const createExchange = async () => {
        const modal = root.querySelector('#exchange-create');
        const invoiceSelect = getInvoiceControl(modal);
        const dateInput = modal.querySelector('input[type="date"]');
        const noteInput = getNoteInput(modal);
        
        const returnPanel = modal.querySelector('.swap-panel.return-only');
        const oldPanel = modal.querySelector('.swap-panel.old');
        const newPanel = modal.querySelector('.swap-panel.new');
        
        const returnSelect = returnPanel.querySelector('select');
        const oldSelect = oldPanel.querySelector('select');
        const newSelect = newPanel.querySelector('select');

        if (!validSelect(invoiceSelect)) {
            alert('Vui lòng chọn hóa đơn gốc.');
            return;
        }
        if (invoiceAlreadyProcessed(invoiceSelect.value)) {
            alert('Hóa đơn này đã có phiếu đổi/trả. Mỗi hóa đơn chỉ được đổi hoặc trả một lần.');
            return;
        }
        if (!validSelect(returnSelect) && !(validSelect(oldSelect) && validSelect(newSelect))) {
            alert('Vui lòng chọn ít nhất 1 sản phẩm trả lại hoặc 1 cặp sản phẩm đổi.');
            return;
        }

        const invoiceCode = invoiceSelect.value;
        const date = dateInput.value || today();
        const reason = noteInput?.value.trim() || 'Đổi/trả hàng';

        if (window.kidCityApi) {
            try {
                if (validSelect(returnSelect)) {
                    await window.kidCityApi.post('sales/returns.php', {
                        invoice_id: invoiceIdByCode(invoiceCode),
                        product_id: invoiceProductId(invoiceCode, returnSelect.value),
                        return_date: date,
                        quantity: Math.max(1, Number(returnPanel.querySelector('input').value || 1)),
                        refund_amount: (prices[returnSelect.value] || 100000) * Math.max(1, Number(returnPanel.querySelector('input').value || 1)),
                        reason: reason + ' (Trả)'
                    });
                }
                if (validSelect(oldSelect) && validSelect(newSelect)) {
                    await window.kidCityApi.post('sales/exchanges.php', {
                        invoice_id: invoiceIdByCode(invoiceCode),
                        old_product_id: invoiceProductId(invoiceCode, oldSelect.value),
                        new_product_id: productDetails[newSelect.value]?.productId || 0,
                        exchange_date: date,
                        quantity: Math.max(1, Number(oldPanel.querySelector('input').value || 1)),
                        reason: reason + ' (Đổi)',
                        type: 'Đổi hàng'
                    });
                }
                closeModal(modal);
                await loadExchangeTableFromApi();
                return;
            } catch (error) {
                alert(error.message || 'Không thể tạo phiếu đổi/trả hàng.');
                return;
            }
        }
        
        const body = root.querySelector('#exchange-table');
        if (validSelect(returnSelect)) {
            const code = nextCode('#exchange-table', 'TH');
            const row = document.createElement('tr');
            row.dataset.key = normalize(`${code} ${invoiceCode} ${reason} Nguyễn Văn An`);
            row.dataset.reason = reason + ' (Trả)';
            row.dataset.oldProduct = returnSelect.value;
            row.dataset.newProduct = '-';
            row.dataset.quantity = Math.max(1, Number(returnPanel.querySelector('input').value || 1));
            row.dataset.refund = formatMoney((prices[returnSelect.value] || 100000) * row.dataset.quantity);
            row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(invoiceCode)}</td><td>${date}</td><td>${reason} (Trả)</td><td>Nguyễn Văn An</td><td></td>`;
            attachActions(row.lastElementChild, 'exchange', 'exchange-detail');
            body.prepend(row);
        }
        if (validSelect(oldSelect) && validSelect(newSelect)) {
            const code = nextCode('#exchange-table', 'DH');
            const row = document.createElement('tr');
            row.dataset.key = normalize(`${code} ${invoiceCode} ${reason} Nguyễn Văn An`);
            row.dataset.reason = reason + ' (Đổi)';
            row.dataset.oldProduct = oldSelect.value;
            row.dataset.newProduct = newSelect.value;
            row.dataset.quantity = Math.max(1, Number(oldPanel.querySelector('input').value || 1));
            row.dataset.refund = formatMoney(0);
            row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(invoiceCode)}</td><td>${date}</td><td>${reason} (Đổi)</td><td>Nguyễn Văn An</td><td></td>`;
            attachActions(row.lastElementChild, 'exchange', 'exchange-detail');
            body.prepend(row);
        }
        updateFirstStat(countRows('#exchange-table'));
        const stats = root.querySelectorAll('.sales-stat strong');
        if (stats[1]) {
            const totalRefund = Array.from(root.querySelectorAll('#exchange-table tr')).reduce((sum, r) => sum + moneyNumber(r.dataset.refund || '0'), 0);
            stats[1].textContent = formatMoney(totalRefund);
        }
        closeModal(modal);
    };

    const bindExchangePage = () => {
        showTableLoading('#exchange-table', 6);
        loadExchangeTableFromApi();
        const modal = root.querySelector('#exchange-create');
        const invoiceSelect = enhanceInvoiceControl(modal, 'exchange-invoice-combo', '.swap-panel.return-only');
        
        invoiceSelect?.addEventListener('change', () => { 
            syncInvoiceProductPanel(modal, '.swap-panel.return-only');
            syncInvoiceProductPanel(modal, '.swap-panel.old');
            updateExchangeRefund(); 
        });
        modal.querySelector('.swap-panel.return-only select')?.addEventListener('change', updateExchangeRefund);
        modal.querySelector('.swap-panel.return-only input')?.addEventListener('input', updateExchangeRefund);
        modal.querySelector('.swap-panel.old select')?.addEventListener('change', updateExchangeRefund);
        modal.querySelector('.swap-panel.old input')?.addEventListener('input', updateExchangeRefund);
        modal.querySelector('.swap-panel.new select')?.addEventListener('change', updateExchangeRefund);
        modal.querySelector('.swap-panel.new input')?.addEventListener('input', updateExchangeRefund);
        root.querySelector('#exchange-create .modal-actions .sales-btn.primary').addEventListener('click', createExchange);
        
        syncInvoiceProductPanel(modal, '.swap-panel.return-only');
        syncInvoiceProductPanel(modal, '.swap-panel.old');
        mergeInvoicesFromApi().then(() => {
            refreshInvoiceDatalist(modal);
            syncInvoiceProductPanel(modal, '.swap-panel.return-only');
            syncInvoiceProductPanel(modal, '.swap-panel.old');
            updateExchangeRefund();
        });
        updateExchangeRefund();
    };

    /* =====================================================
       RETURNS - Tạo phiếu trả hàng frontend tạm
       ===================================================== */
    const updateReturnRefund = () => {
        const modal = root.querySelector('#return-create');
        if (!modal) return;
        const returnSelect = modal.querySelector('.swap-panel.return-only select');
        const returnQty = modal.querySelector('.swap-panel.return-only input[type="number"]');
        const oldSelect = modal.querySelector('.swap-panel.old select');
        const oldQty = modal.querySelector('.swap-panel.old input[type="number"]');
        const newSelect = modal.querySelector('.swap-panel.new select');
        const newQty = modal.querySelector('.swap-panel.new input[type="number"]');
        
        let refund = 0;
        if (validSelect(returnSelect)) refund += (prices[returnSelect.value] || 100000) * Math.max(1, Number(returnQty?.value || 1));
        if (validSelect(oldSelect)) refund += (prices[oldSelect.value] || 100000) * Math.max(1, Number(oldQty?.value || 1));
        if (validSelect(newSelect)) refund -= (prices[newSelect.value] || 100000) * Math.max(1, Number(newQty?.value || 1));
        
        const totalRefundEl = modal.querySelector('#return-total-refund');
        if (totalRefundEl) {
            totalRefundEl.textContent = formatMoney(refund);
            totalRefundEl.className = refund >= 0 ? 'green font-weight-600' : 'red font-weight-600';
        }
    };

    const createReturn = async () => {
        const modal = root.querySelector('#return-create');
        const invoiceSelect = getInvoiceControl(modal);
        const dateInput = modal.querySelector('input[type="date"]');
        const noteInput = getNoteInput(modal);
        
        const returnPanel = modal.querySelector('.swap-panel.return-only');
        const oldPanel = modal.querySelector('.swap-panel.old');
        const newPanel = modal.querySelector('.swap-panel.new');
        
        const returnSelect = returnPanel.querySelector('select');
        const oldSelect = oldPanel.querySelector('select');
        const newSelect = newPanel.querySelector('select');

        if (!validSelect(invoiceSelect)) {
            alert('Vui lòng chọn hóa đơn gốc.');
            return;
        }
        if (invoiceAlreadyProcessed(invoiceSelect.value)) {
            alert('Hóa đơn này đã có phiếu đổi/trả. Mỗi hóa đơn chỉ được đổi hoặc trả một lần.');
            return;
        }
        if (!validSelect(returnSelect) && !(validSelect(oldSelect) && validSelect(newSelect))) {
            alert('Vui lòng chọn ít nhất 1 sản phẩm trả lại hoặc 1 cặp sản phẩm đổi.');
            return;
        }

        const invoiceCode = invoiceSelect.value;
        const date = dateInput.value || today();
        const reason = noteInput?.value.trim() || 'Đổi/trả hàng';

        if (window.kidCityApi) {
            try {
                if (validSelect(returnSelect)) {
                    await window.kidCityApi.post('sales/returns.php', {
                        invoice_id: invoiceIdByCode(invoiceCode),
                        product_id: invoiceProductId(invoiceCode, returnSelect.value),
                        return_date: date,
                        quantity: Math.max(1, Number(returnPanel.querySelector('input').value || 1)),
                        refund_amount: (prices[returnSelect.value] || 100000) * Math.max(1, Number(returnPanel.querySelector('input').value || 1)),
                        reason: reason + ' (Trả)'
                    });
                }
                if (validSelect(oldSelect) && validSelect(newSelect)) {
                    await window.kidCityApi.post('sales/exchanges.php', {
                        invoice_id: invoiceIdByCode(invoiceCode),
                        old_product_id: invoiceProductId(invoiceCode, oldSelect.value),
                        new_product_id: productDetails[newSelect.value]?.productId || 0,
                        exchange_date: date,
                        quantity: Math.max(1, Number(oldPanel.querySelector('input').value || 1)),
                        reason: reason + ' (Đổi)',
                        type: 'Đổi hàng'
                    });
                }
                closeModal(modal);
                await loadReturnTableFromApi();
                return;
            } catch (error) {
                alert(error.message || 'Không thể tạo phiếu đổi/trả hàng.');
                return;
            }
        }
        
        const body = root.querySelector('#return-table');
        if (validSelect(returnSelect)) {
            const code = nextCode('#return-table', 'TH');
            const row = document.createElement('tr');
            const qty = Math.max(1, Number(returnPanel.querySelector('input').value || 1));
            row.dataset.key = normalize(`${code} ${invoiceCode} ${reason} Nguyễn Văn An`);
            row.dataset.product = returnSelect.value;
            row.dataset.quantity = qty;
            row.dataset.refund = formatMoney((prices[returnSelect.value] || 100000) * qty);
            row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(invoiceCode)}</td><td>${date}</td><td>${reason} (Trả)</td><td>Nguyễn Văn An</td><td></td>`;
            attachActions(row.lastElementChild, 'return', 'return-detail');
            body.prepend(row);
        }
        if (validSelect(oldSelect) && validSelect(newSelect)) {
            const code = nextCode('#return-table', 'DH');
            const row = document.createElement('tr');
            row.dataset.key = normalize(`${code} ${invoiceCode} ${reason} Nguyễn Văn An`);
            row.dataset.product = oldSelect.value;
            row.dataset.quantity = Math.max(1, Number(oldPanel.querySelector('input').value || 1));
            row.dataset.refund = formatMoney(0);
            row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(invoiceCode)}</td><td>${date}</td><td>${reason} (Đổi)</td><td>Nguyễn Văn An</td><td></td>`;
            attachActions(row.lastElementChild, 'return', 'return-detail');
            body.prepend(row);
        }
        updateFirstStat(countRows('#return-table'));
        const stats = root.querySelectorAll('.sales-stat strong');
        if (stats[1]) {
            const totalRefund = Array.from(root.querySelectorAll('#return-table tr')).reduce((sum, r) => sum + moneyNumber(r.dataset.refund || '0'), 0);
            stats[1].textContent = formatMoney(totalRefund);
        }
        closeModal(modal);
    };

    const bindReturnPage = () => {
        showTableLoading('#return-table', 6);
        loadReturnTableFromApi();
        const modal = root.querySelector('#return-create');
        const invoiceSelect = enhanceInvoiceControl(modal, 'return-invoice-combo', '.swap-panel.return-only');
        
        invoiceSelect?.addEventListener('change', () => { 
            syncInvoiceProductPanel(modal, '.swap-panel.return-only');
            syncInvoiceProductPanel(modal, '.swap-panel.old');
            updateReturnRefund(); 
        });
        modal.querySelector('.swap-panel.return-only select')?.addEventListener('change', updateReturnRefund);
        modal.querySelector('.swap-panel.return-only input')?.addEventListener('input', updateReturnRefund);
        modal.querySelector('.swap-panel.old select')?.addEventListener('change', updateReturnRefund);
        modal.querySelector('.swap-panel.old input')?.addEventListener('input', updateReturnRefund);
        modal.querySelector('.swap-panel.new select')?.addEventListener('change', updateReturnRefund);
        modal.querySelector('.swap-panel.new input')?.addEventListener('input', updateReturnRefund);
        root.querySelector('#return-create .modal-actions .sales-btn.primary').addEventListener('click', createReturn);
        
        syncInvoiceProductPanel(modal, '.swap-panel.return-only');
        syncInvoiceProductPanel(modal, '.swap-panel.old');
        mergeInvoicesFromApi().then(() => {
            refreshInvoiceDatalist(modal);
            syncInvoiceProductPanel(modal, '.swap-panel.return-only');
            syncInvoiceProductPanel(modal, '.swap-panel.old');
            updateReturnRefund();
        });
        updateReturnRefund();
    };

    /* =====================================================
       PAGE INIT - Gọi đúng phần xử lý theo trang đang load
       ===================================================== */
    bindSearch();

    if (root.id === 'invoice-page') bindInvoicePage();
    if (root.id === 'exchange-page') bindExchangePage();
    if (root.id === 'return-page') bindReturnPage();
};
