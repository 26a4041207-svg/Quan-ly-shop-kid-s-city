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
    
    const formatDateTime = (str) => {
        if (!str) return '';
        const cleanStr = str.replace(/-/g, '/');
        const d = new Date(cleanStr);
        if (isNaN(d.getTime())) return str;
        const date = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    const showSelectedProductInfo = (modal, productName) => {
        const infoCard = modal.querySelector('.selected-product-info');
        if (!infoCard) return;
        const product = invoiceProductOptions.find(item => item.name === productName);
        if (!product) {
            infoCard.style.display = 'none';
            return;
        }
        infoCard.style.display = 'flex';
        infoCard.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-size: 14px; color: #1e293b;">
                    <strong style="color: #0f172a;">${product.code || 'SP000'}</strong> 
                    <span>${product.name}</span>
                </span>
                <div style="display: flex; gap: 8px; font-size: 12px; color: #64748b;">
                    <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${product.category || 'Chưa phân loại'}</span>
                    <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">Size: ${product.size || '-'}</span>
                    <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">Màu: ${product.color || '-'}</span>
                    <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">SL: ${product.stock ?? '-'}</span>
                </div>
            </div>
            <strong style="color: #16a34a; font-size: 16px;">${formatMoney(product.price)}</strong>
        `;
    };
    
    const hideSelectedProductInfo = (modal) => {
        const infoCard = modal.querySelector('.selected-product-info');
        if (infoCard) {
            infoCard.style.display = 'none';
        }
    };

    const today = () => new Date().toISOString().slice(0, 10);
    const removeAccents = (str) => {
        return (str || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    };
    const normalize = (text) => removeAccents((text || '').trim().toLowerCase());
    const validSelect = (select) => select && select.value && !select.value.includes('--');
    const invoiceProductOptions = Object.keys(prices).map((name) => ({
        name,
        code: productCodes[name] || 'SP000',
        price: prices[name] || 100000,
        ...(productDetails[name] || {})
    }));
    const invoiceCustomerOptions = [];
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
        const panels = modal?.querySelectorAll(panelSelector) || [];
        panels.forEach((panel) => {
            const productSelect = panel?.querySelector('select');
            const quantityInput = panel?.querySelector('input[type="number"]');
            if (!invoiceSelect || !productSelect) return;

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
        });
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
        value.dispatchEvent(new Event('change', { bubbles: true }));
        combo.classList.remove('open');
        showSelectedProductInfo(modal, productName);
    };

    const setupProductCombobox = (modal) => {
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
        });
        input.addEventListener('input', () => {
            value.value = '';
            renderProductOptions(modal, input.value);
            combo.classList.add('open');
            hideSelectedProductInfo(modal);
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

    const renderCustomerOptions = (modal, keyword = '') => {
        const optionsBox = modal.querySelector('[data-customer-options]');
        if (!optionsBox) return;

        const normalizedKeyword = normalize(keyword);
        const results = invoiceCustomerOptions.filter((item) => {
            const searchable = `${item.name} ${item.phone}`;
            return normalize(searchable).includes(normalizedKeyword);
        });

        optionsBox.innerHTML = results.length
            ? results.map((item) => `
                <button type="button" class="combo-option" data-customer-name="${item.name}" data-customer-id="${item.id}" data-customer-phone="${item.phone}">
                    <span class="combo-main" style="align-items: center;">
                        <span class="combo-title"><strong>${item.name}</strong></span>
                        <span class="combo-meta" style="margin-left: 10px;">
                            <b><i class='bx bx-phone'></i> ${item.phone || 'Không có số ĐT'}</b>
                        </span>
                    </span>
                </button>
            `).join('')
            : '<div class="combo-empty">Không tìm thấy khách hàng.</div>';
    };

    const setInvoiceCustomer = (modal, customerName) => {
        const input = modal.querySelector('[data-customer-search]');
        const value = modal.querySelector('[data-customer-value]');
        const combo = modal.querySelector('[data-customer-combobox]');
        if (!input || !value || !combo) return;
        input.value = customerName;
        value.value = customerName;
        combo.classList.remove('open');
        
        // Clear error if any
        const errorSpan = combo.closest('.field').querySelector('.error-message');
        if (errorSpan) errorSpan.style.display = 'none';
        input.style.borderColor = '';
    };

    const initInvoiceCustomerCombobox = () => {
        const modal = root.querySelector('#invoice-create');
        if (!modal || modal.dataset.customerComboReady === 'true') return;
        modal.dataset.customerComboReady = 'true';

        const combo = modal.querySelector('[data-customer-combobox]');
        const input = modal.querySelector('[data-customer-search]');
        const value = modal.querySelector('[data-customer-value]');
        const toggle = modal.querySelector('[data-customer-toggle]');
        const optionsBox = modal.querySelector('[data-customer-options]');
        if (!combo || !input || !value || !toggle || !optionsBox) return;

        renderCustomerOptions(modal);
        input.addEventListener('focus', () => {
            renderCustomerOptions(modal, input.value);
            combo.classList.add('open');
        });
        input.addEventListener('input', () => {
            value.value = '';
            renderCustomerOptions(modal, input.value);
            combo.classList.add('open');
        });
        toggle.addEventListener('click', () => {
            renderCustomerOptions(modal, input.value);
            combo.classList.toggle('open');
            input.focus();
        });
        optionsBox.addEventListener('click', (event) => {
            const option = event.target.closest('[data-customer-name]');
            if (!option) return;
            setInvoiceCustomer(modal, option.dataset.customerName);
            value.dataset.customerId = option.dataset.customerId;
        });
        document.addEventListener('click', (event) => {
            if (!combo.contains(event.target) && !event.target.closest('.add-customer-link')) {
                combo.classList.remove('open');
            }
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
    const isProductAlreadyProcessed = (invoiceCode, productId) => {
        let processed = false;
        root.querySelectorAll('#exchange-table tr').forEach(row => {
            if (rowText(row, 1).trim() === invoiceCode && String(row.dataset.oldProductId) === String(productId)) processed = true;
        });
        root.querySelectorAll('#return-table tr').forEach(row => {
            if (rowText(row, 1).trim() === invoiceCode && String(row.dataset.productId) === String(productId)) processed = true;
        });
        return processed;
    };
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

    const mapInvoiceFromApi = (invoice) => {
        const createdAt = invoice.created_at || '';
        const updatedAt = invoice.updated_at || '';
        const formattedCreated = formatDateTime(createdAt) || 'Thời gian ban đầu';
        const formattedUpdated = formatDateTime(updatedAt);
        const updateHistory = [];
        if (updatedAt && createdAt && updatedAt !== createdAt) {
            updateHistory.push(formattedUpdated);
        }

        const initialSnapshot = {
            customer: invoice.customer_name || '',
            staff: invoice.staff_name || '',
            date: invoice.invoice_date || invoice.created_at || '',
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
            ]),
            timestamp: formattedCreated
        };

        const snapshots = [initialSnapshot];

        if (updatedAt && createdAt && updatedAt !== createdAt) {
            const updatedSnapshot = {
                customer: invoice.customer_name || '',
                staff: invoice.staff_name || '',
                date: invoice.invoice_date || invoice.created_at || '',
                note: invoice.note || 'Không có',
                total: formatMoney(invoice.total),
                items: initialSnapshot.items,
                timestamp: formattedUpdated
            };
            snapshots.push(updatedSnapshot);
        }

        return {
            id: Number(invoice.id || 0),
            customer: invoice.customer_name || '',
            staff: invoice.staff_name || '',
            date: invoice.invoice_date || invoice.created_at || '',
            createdAt: createdAt,
            updatedAt: updatedAt,
            updateHistory: updateHistory,
            historySnapshots: snapshots,
            note: invoice.note || 'Không có',
            total: formatMoney(invoice.total),
            items: initialSnapshot.items
        };
    };

    const showTableLoading = (selector, colspan) => {
        const body = root.querySelector(selector);
        if (body) body.innerHTML = `<tr><td colspan="${colspan}" class="empty-row">Đang tải dữ liệu từ database...</td></tr>`;
    };

    const showTableError = (selector, colspan) => {
        const body = root.querySelector(selector);
        if (body) body.innerHTML = `<tr><td colspan="${colspan}" class="empty-row">Không tải được dữ liệu từ database.</td></tr>`;
    };

    const loadInvoiceFormDataFromApi = async () => {
        if (!window.kidCityApi) return;
        try {
            const [customers, products] = await Promise.all([
                window.kidCityApi.get('customers/index.php'),
                window.kidCityApi.get('products/items.php')
            ]);

            if (Array.isArray(customers)) {
                invoiceCustomerOptions.splice(0, invoiceCustomerOptions.length);
                customers.forEach((customer) => {
                    invoiceCustomerOptions.push({
                        id: customer.id || 0,
                        name: customer.name || '',
                        phone: customer.phone || ''
                    });
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
                row.dataset.key = normalize(`${invoice.code || ''} ${invoice.customer_name || ''} ${invoice.staff_name || ''}`);
                row.innerHTML = `<td><strong>${invoice.code || ''}</strong></td><td>${invoice.invoice_date || ''}</td><td>${invoice.customer_name || ''}</td><td>${invoice.staff_name || ''}</td><td></td>`;
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
            showTableError('#invoice-table', 5);
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
                row.dataset.oldProductId = item.old_product_id || '';
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
                row.dataset.productId = item.product_id || '';
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
        if (modal) {
            modal.classList.add('active');
            if (id === 'invoice-create') {
                const dateInput = modal.querySelector('#invoice-date-input');
                if (dateInput) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const date = String(now.getDate()).padStart(2, '0');
                    dateInput.value = `${date}/${month}/${year}`;
                }
                hideSelectedProductInfo(modal);
            }
            if (id === 'exchange-create' || id === 'return-create') {
                const dateInputs = modal.querySelectorAll('[data-current-date]');
                dateInputs.forEach(input => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const date = String(now.getDate()).padStart(2, '0');
                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const seconds = String(now.getSeconds()).padStart(2, '0');
                    input.value = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
                });
            }
        }
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
                <td><strong>${item[4]}</strong></td>
            </tr>
        `).join('');

        let subtotalNum = 0;
        invoice.items.forEach(item => {
            subtotalNum += Number(item[6] || 0) * Number(item[2] || 1);
        });
        const totalNum = moneyNumber(invoice.total || '0');
        const discountNum = Math.max(0, subtotalNum - totalNum);

        let historyHtml = '';
        const snapshots = invoice.historySnapshots || [];
        if (snapshots.length > 1) {
            const historyOptions = snapshots.slice().reverse().map((snap, idx) => {
                const originalIndex = snapshots.length - 1 - idx;
                const isInitial = originalIndex === 0;
                const label = isInitial ? `${snap.timestamp} (Ban đầu)` : snap.timestamp;
                return `<option value="${originalIndex}">${label}</option>`;
            }).join('');

            historyHtml = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px; font-weight: 600; color: #64748b;">Thời gian cập nhật</span>
                    <select class="update-history-dropdown" style="border: 1px solid #dbe4f0; border-radius: 6px; padding: 6px 12px; color: #334155; font-size: 13px; outline: none; background: #fff; min-width: 180px;">
                        ${historyOptions}
                    </select>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="sales-dialog detail">
                <div class="sales-modal-body">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                        <h2 class="detail-title" style="margin: 0;">Chi tiết hóa đơn ${code}</h2>
                        ${historyHtml}
                    </div>
                    <div class="detail-grid">
                        <div class="detail-item"><span>Khách hàng</span><strong class="detail-customer">${invoice.customer}</strong></div>
                        <div class="detail-item"><span>Nhân viên</span><strong class="detail-staff">${invoice.staff}</strong></div>
                        <div class="detail-item"><span>Ngày lập</span><strong class="detail-date">${invoice.date}</strong></div>
                        <div class="detail-item"><span>Ghi chú</span><strong class="detail-note">${invoice.note}</strong></div>
                    </div>
                    <h3 class="section-title">Chi tiết sản phẩm</h3>
                    <table class="sales-table">
                        <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th></tr></thead>
                        <tbody class="detail-items-body">${rows}</tbody>
                    </table>
                    
                    <div class="invoice-summary" style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                        <div class="summary-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="color: #64748b; font-weight: 500;">Tổng tiền</span>
                            <strong data-detail-subtotal style="color: #334155;">${formatMoney(subtotalNum)}</strong>
                        </div>
                        <div class="summary-row discount-row" style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                            <span style="color: #64748b; font-weight: 500;">Ưu đãi</span>
                            <strong data-detail-discount style="color: #334155;">${formatMoney(discountNum)}</strong>
                        </div>
                        <div class="summary-row total-row" style="display: flex; justify-content: space-between; font-size: 1.1em; padding-top: 10px; border-top: 1px dashed #dbe4f0;">
                            <span style="color: #0f172a; font-weight: 600;">Thành tiền</span>
                            <strong class="detail-total" style="color: #10b981; font-size: 1.2em;">${invoice.total}</strong>
                        </div>
                    </div>

                    <button class="sales-btn primary block" data-close style="margin-top: 20px;">Đóng</button>
                </div>
            </div>
        `;

        const dropdown = modal.querySelector('.update-history-dropdown');
        if (dropdown) {
            dropdown.addEventListener('change', (e) => {
                const selectedIndex = e.target.value;
                if (selectedIndex === 'current') return;
                const snapshots = invoice.historySnapshots || [];
                const snap = snapshots[selectedIndex];
                if (snap) {
                    modal.querySelector('.detail-customer').textContent = snap.customer;
                    modal.querySelector('.detail-staff').textContent = snap.staff;
                    modal.querySelector('.detail-date').textContent = snap.date;
                    modal.querySelector('.detail-note').textContent = snap.note;
                    let subNum = 0;
                    snap.items.forEach(item => {
                        subNum += Number(item[6] || 0) * Number(item[2] || 1);
                    });
                    const totNum = moneyNumber(snap.total || '0');
                    const discNum = Math.max(0, subNum - totNum);

                    modal.querySelector('[data-detail-subtotal]').textContent = formatMoney(subNum);
                    modal.querySelector('[data-detail-discount]').textContent = formatMoney(discNum);
                    modal.querySelector('.detail-total').textContent = snap.total;
                    
                    const newRows = snap.items.map((item) => `
                        <tr>
                            <td>${item[0]}</td>
                            <td>${item[1]}</td>
                            <td>${item[2]}</td>
                            <td><strong>${item[4]}</strong></td>
                        </tr>
                    `).join('');
                    modal.querySelector('.detail-items-body').innerHTML = newRows;
                }
            });
        }
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
            if (openBtn.dataset.open === 'invoice-detail') {
                const code = rowText(row, 0);
                openInvoiceDetailByCode(code);
                return;
            }
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
            ? invoice.items.map((item) => {
                const name = item[0] || '';
                const priceFormatted = item[1] || '0đ';
                const qty = item[2] || '1';
                const totalFormatted = item[4] || item[3] || '0đ';
                const priceNum = item[6] || moneyNumber(priceFormatted);
                const productId = item[5] || 0;
                
                return `
                    <tr data-product-name="${name}" data-price="${priceNum}" data-product-id="${productId}">
                        <td><span class="invoice-edit-product-name">${name}</span></td>
                        <td>${priceFormatted}</td>
                        <td><input type="number" class="edit-item-qty" min="1" value="${qty}" style="width: 70px; border: 1px solid #dbe4f0; border-radius: 6px; padding: 4px 6px; text-align: center; color: #334155; outline: none;"></td>
                        <td class="edit-item-total" style="font-weight: 600; color: #0f172a;">${totalFormatted}</td>
                        <td style="text-align: center;"><button type="button" class="action-btn delete edit-delete-item-btn" title="Xóa sản phẩm" style="padding: 4px 8px;"><i class='bx bx-trash'></i></button></td>
                    </tr>
                `;
            }).join('')
            : '<tr><td colspan="5" class="empty-row">Chưa có chi tiết sản phẩm.</td></tr>';
        
        const totalVal = invoice.total || '0đ';
        const productSelectOptions = invoiceProductOptions.map(p => 
            `<option value="${p.name}">${p.code} - ${p.name} (${formatMoney(p.price)})</option>`
        ).join('');

        const modal = showWorkModal('invoice-edit-modal', `Sửa hóa đơn ${code}`, `
            <div class="edit-summary">Cập nhật thông tin chính của hóa đơn. Phần chi tiết sản phẩm đang sửa ở mức dữ liệu giao diện.</div>
            <div class="form-grid edit-grid">
                <div class="field"><label>Mã hóa đơn</label><input data-field="code" value="${code}" disabled></div>
                <div class="field"><label>Ngày lập</label><input type="text" data-field="date" value="${rowText(row, 1)}" disabled></div>
                <div class="field"><label>Khách hàng</label><input data-field="customer" value="${rowText(row, 2)}"></div>
                <div class="field"><label>Nhân viên</label><input data-field="staff" value="${rowText(row, 3)}" disabled></div>
            </div>
            
            <div class="edit-product-heading">
                <h3 class="section-title edit-section-title" style="margin: 0;">Chi tiết hóa đơn</h3>
            </div>
            <div style="display: flex; gap: 10px; margin-bottom: 12px; align-items: flex-end; background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 13px; font-weight: 600; color: #64748b;">Chọn sản phẩm</label>
                    <div class="product-combobox" data-edit-product-combobox style="width: 100%;">
                        <input type="text" data-edit-product-search placeholder="Nhập tên hoặc mã sản phẩm..." autocomplete="off" style="width: 100%; border: 1px solid #dbe4f0; border-radius: 8px; padding: 8px 10px; color: #334155; outline: none;">
                        <input type="hidden" data-edit-product-value>
                        <button type="button" class="combo-toggle" data-edit-product-toggle aria-label="Mở danh sách sản phẩm"><i class='bx bx-chevron-down'></i></button>
                        <div class="combo-options" data-edit-product-options></div>
                    </div>
                </div>
                <div style="width: 100px; display: flex; flex-direction: column; gap: 4px;">
                    <label style="font-size: 13px; font-weight: 600; color: #64748b;">Số lượng</label>
                    <input type="number" id="edit-add-product-qty" min="1" value="1" style="width: 100%; border: 1px solid #dbe4f0; border-radius: 8px; padding: 8px 10px; color: #334155; outline: none;">
                </div>
                <button type="button" id="edit-add-product-btn" class="sales-btn primary" style="padding: 10px 16px; display: flex; align-items: center; gap: 6px; height: 38px;">
                    <i class='bx bx-plus'></i> Thêm SP
                </button>
            </div>
            
            <table class="sales-table">
                <thead><tr><th>Sản phẩm</th><th>Đơn giá</th><th>SL</th><th>Thành tiền</th><th style="width: 58px; text-align: center;">Thao tác</th></tr></thead>
                <tbody>${detailRows}</tbody>
            </table>
            
            <div class="invoice-summary" style="margin-top: 20px;">
                <div class="summary-row"><span>Tổng tiền</span><strong data-invoice-subtotal>0đ</strong></div>
                <div class="summary-row discount-row" style="flex-wrap: wrap;">
                    <span>Ưu đãi</span>
                    <input type="text" data-invoice-discount value="0đ">
                    <span class="discount-error" style="color: red; font-size: 12px; display: none; width: 100%; text-align: right; margin-top: 4px;">Ưu đãi vượt quá 15% (tối đa <span class="max-discount-val"></span>)</span>
                </div>
                <div class="summary-row total-row"><span>Thành tiền</span><strong data-invoice-total>0đ</strong></div>
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary" data-save-edit="invoice">Lưu thay đổi</button>`);

        const recalculateTotals = () => {
            let sum = 0;
            const rows = modal.querySelectorAll('.sales-table tbody tr');
            rows.forEach((row) => {
                if (row.querySelector('.empty-row')) return;
                const priceVal = Number(row.dataset.price || 0);
                const qtyVal = Math.max(1, Number(row.querySelector('.edit-item-qty').value || 1));
                const lineTotal = priceVal * qtyVal;
                sum += lineTotal;
                row.querySelector('.edit-item-total').textContent = formatMoney(lineTotal);
            });
            const subtotalEl = modal.querySelector('[data-invoice-subtotal]');
            const totalEl = modal.querySelector('[data-invoice-total]');
            const discountInput = modal.querySelector('[data-invoice-discount]');
            
            if (subtotalEl) subtotalEl.textContent = formatMoney(sum);
            
            if (discountInput) {
                if (!discountInput.dataset.manualOverride) {
                    discountInput.value = sum > 1000000 ? formatMoney(Math.round(sum * 0.1)) : '0đ';
                }
            }
            
            let discount = moneyNumber(discountInput?.value);
            const maxDiscount = Math.round(sum * 0.15);
            const errorSpan = modal.querySelector('.discount-error');

            if (discount > maxDiscount) {
                discount = maxDiscount;
                if (discountInput) {
                    discountInput.value = formatMoney(discount);
                    discountInput.style.borderColor = 'red';
                }
                if (errorSpan) {
                    errorSpan.style.display = 'block';
                    const maxValSpan = errorSpan.querySelector('.max-discount-val');
                    if (maxValSpan) maxValSpan.textContent = formatMoney(maxDiscount);
                }
            } else {
                if (discountInput) discountInput.style.borderColor = '';
                if (errorSpan) errorSpan.style.display = 'none';
            }

            if (totalEl) totalEl.textContent = formatMoney(Math.max(0, sum - discount));
        };

        // Quantity inputs change
        modal.querySelector('.sales-table tbody').addEventListener('input', (e) => {
            if (e.target.classList.contains('edit-item-qty')) {
                recalculateTotals();
            }
        });

        // Deleting products
        modal.querySelector('.sales-table tbody').addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.edit-delete-item-btn');
            if (deleteBtn) {
                const row = deleteBtn.closest('tr');
                row.remove();
                
                const tbody = modal.querySelector('.sales-table tbody');
                if (tbody.children.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="empty-row">Chưa có chi tiết sản phẩm.</td></tr>';
                }
                recalculateTotals();
            }
        });

        // Setup combobox
        const combo = modal.querySelector('[data-edit-product-combobox]');
        const input = modal.querySelector('[data-edit-product-search]');
        const value = modal.querySelector('[data-edit-product-value]');
        const toggle = modal.querySelector('[data-edit-product-toggle]');
        const optionsBox = modal.querySelector('[data-edit-product-options]');
        
        const renderEditProductOptions = (keyword = '') => {
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

        if (combo && input && value && toggle && optionsBox) {
            renderEditProductOptions();
            input.addEventListener('focus', () => {
                renderEditProductOptions(input.value);
                combo.classList.add('open');
            });
            input.addEventListener('input', () => {
                value.value = '';
                renderEditProductOptions(input.value);
                combo.classList.add('open');
            });
            toggle.addEventListener('click', () => {
                renderEditProductOptions(input.value);
                combo.classList.toggle('open');
                input.focus();
            });
            optionsBox.addEventListener('click', (event) => {
                const option = event.target.closest('[data-product-name]');
                if (!option) return;
                input.value = option.dataset.productName;
                value.value = option.dataset.productName;
                combo.classList.remove('open');
            });
            document.addEventListener('click', (event) => {
                if (!combo.contains(event.target)) combo.classList.remove('open');
            });
        }

        modal.querySelector('[data-invoice-discount]')?.addEventListener('input', (event) => {
            event.target.dataset.manualOverride = 'true';
            recalculateTotals();
        });
        modal.querySelector('[data-invoice-discount]')?.addEventListener('blur', (event) => {
            event.target.value = formatMoney(moneyNumber(event.target.value));
            recalculateTotals();
        });

        // Adding products
        modal.querySelector('#edit-add-product-btn').onclick = () => {
            const typed = input?.value.trim();
            const val = value?.value.trim();
            let productName = val && prices[val] ? val : '';
            if (!productName) {
                const exactMatch = invoiceProductOptions.find((item) => normalize(item.name) === normalize(typed) || normalize(item.code) === normalize(typed));
                productName = exactMatch?.name || '';
            }

            const qtyInput = modal.querySelector('#edit-add-product-qty');
            const quantity = Math.max(1, Number(qtyInput.value || 1));
            
            if (!productName) {
                alert('Vui lòng chọn sản phẩm cần thêm.');
                return;
            }
            
            const productInfo = invoiceProductOptions.find(p => p.name === productName) || {};
            const priceNum = productInfo.price || 0;
            const productId = productInfo.id || 0;
            const priceFormatted = formatMoney(priceNum);
            const lineTotalFormatted = formatMoney(priceNum * quantity);
            
            const tbody = modal.querySelector('.sales-table tbody');
            const empty = tbody.querySelector('.empty-row');
            if (empty) empty.closest('tr').remove();
            
            const existingRow = tbody.querySelector(`tr[data-product-name="${productName}"]`);
            if (existingRow) {
                const existingQtyInput = existingRow.querySelector('.edit-item-qty');
                existingQtyInput.value = String(Number(existingQtyInput.value || 0) + quantity);
            } else {
                const newRow = document.createElement('tr');
                newRow.dataset.productName = productName;
                newRow.dataset.price = String(priceNum);
                newRow.dataset.productId = String(productId);
                newRow.innerHTML = `
                    <td><span class="invoice-edit-product-name">${productName}</span></td>
                    <td>${priceFormatted}</td>
                    <td><input type="number" class="edit-item-qty" min="1" value="${quantity}" style="width: 70px; border: 1px solid #dbe4f0; border-radius: 6px; padding: 4px 6px; text-align: center; color: #334155; outline: none;"></td>
                    <td class="edit-item-total" style="font-weight: 600; color: #0f172a;">${lineTotalFormatted}</td>
                    <td style="text-align: center;"><button type="button" class="action-btn delete edit-delete-item-btn" title="Xóa sản phẩm" style="padding: 4px 8px;"><i class='bx bx-trash'></i></button></td>
                `;
                tbody.appendChild(newRow);
            }
            if (input) input.value = '';
            if (value) value.value = '';
            qtyInput.value = '1';
            recalculateTotals();
        };

        // Initialize totals on open
        recalculateTotals();

        // Saving edits
        modal.querySelector('[data-save-edit="invoice"]').onclick = async () => {
            const customerText = fieldValue(modal, 'customer');
            if (!customerText) {
                alert('Vui lòng nhập tên khách hàng.');
                return;
            }

            const dateText = fieldValue(modal, 'date');
            const staffText = fieldValue(modal, 'staff');
            
            let sum = 0;
            const rows = modal.querySelectorAll('.sales-table tbody tr');
            const items = [];
            rows.forEach((row) => {
                if (row.querySelector('.empty-row')) return;
                const name = row.dataset.productName;
                const priceNum = Number(row.dataset.price || 0);
                const productId = Number(row.dataset.productId || 0);
                const qty = Math.max(1, Number(row.querySelector('.edit-item-qty').value || 1));
                
                sum += priceNum * qty;
                items.push([
                    name,
                    formatMoney(priceNum),
                    String(qty),
                    '0đ',
                    formatMoney(priceNum * qty),
                    productId,
                    priceNum
                ]);
            });
            const discountInput = modal.querySelector('[data-invoice-discount]');
            let discount = moneyNumber(discountInput?.value);
            const maxDiscount = Math.round(sum * 0.15);
            if (discount > maxDiscount) discount = maxDiscount;
            
            const totalText = formatMoney(Math.max(0, sum - discount));
            
            const putData = {
                id: invoiceDetails[code]?.id || invoiceIdByCode(code),
                note: invoiceDetails[code]?.note || '',
                discount: discount,
                items: items.map(item => ({
                    product_id: item[5],
                    quantity: Number(item[2]),
                    price: item[6],
                    discount: 0
                }))
            };

            try {
                await window.kidCityApi.put('sales/invoices.php', putData);
                row.innerHTML = `<td><strong>${code}</strong></td><td>${dateText}</td><td>${customerText}</td><td>${staffText}</td><td></td>`;
                attachActions(row.lastElementChild, 'invoice', 'invoice-detail');
                
                if (!invoiceDetails[code]) invoiceDetails[code] = {};

                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const date = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                const formattedTime = `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;

                if (!invoiceDetails[code].historySnapshots) {
                    invoiceDetails[code].historySnapshots = [{
                        customer: invoiceDetails[code].customer || customerText,
                        staff: invoiceDetails[code].staff || staffText,
                        date: invoiceDetails[code].date || dateText,
                        note: invoiceDetails[code].note || 'Không có',
                        total: invoiceDetails[code].total || totalText,
                        items: invoiceDetails[code].items || items,
                        timestamp: formatDateTime(invoiceDetails[code].createdAt) || 'Thời gian ban đầu'
                    }];
                }

                invoiceDetails[code].historySnapshots.push({
                    customer: customerText,
                    staff: staffText,
                    date: dateText,
                    note: invoiceDetails[code].note || 'Không có',
                    total: totalText,
                    items: items,
                    timestamp: formattedTime
                });

                invoiceDetails[code].date = dateText;
                invoiceDetails[code].customer = customerText;
                invoiceDetails[code].staff = staffText;
                invoiceDetails[code].total = totalText;
                invoiceDetails[code].items = items;
                invoiceDetails[code].updatedAt = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
                if (!invoiceDetails[code].updateHistory) {
                    invoiceDetails[code].updateHistory = [];
                }
                invoiceDetails[code].updateHistory.push(formattedTime);

                updateRowKey(row);
                renderInvoicePagination();
                closeModal(modal);
            } catch (error) {
                alert(error.message || 'Không thể cập nhật hóa đơn.');
                console.error(error);
            }
        };
    };

    const openExchangeEditModal = (row) => {
        const code = rowText(row, 0);
        const invoiceCode = rowText(row, 1);
        const oldProduct = row.dataset.oldProduct || '';
        const newProduct = row.dataset.newProduct || '';
        const quantity = row.dataset.quantity || '1';
        
        const invoice = invoiceDetails[invoiceCode] || {};
        const items = invoice.items || [];
        
        let oldProductOptions = items.map(item => `<option value="${item[5]}" data-name="${item[0]}" data-price="${item[6]}" data-max="${item[2]}" ${item[0] === oldProduct || String(item[5]) === String(row.dataset.oldProductId) ? 'selected' : ''}>${item[0]} (Tối đa: ${item[2]})</option>`).join('');
        if (!oldProductOptions) oldProductOptions = `<option value="${row.dataset.oldProductId || ''}" data-name="${oldProduct}" data-price="0" data-max="${quantity}" selected>${oldProduct}</option>`;

        const modal = showWorkModal('exchange-edit-modal', `Sửa phiếu đổi ${code}`, `
            <div class="edit-summary">Cập nhật thông tin phiếu đổi và chi tiết sản phẩm đổi.</div>
            <div class="form-grid edit-grid">
                <div class="field"><label>Mã đổi hàng</label><input data-field="code" value="${code}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Mã hóa đơn</label><input data-field="invoiceCode" value="${invoiceCode}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Ngày đổi</label><input type="date" data-field="date" value="${rowText(row, 2)}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Nhân viên xử lý</label><input data-field="staff" value="${rowText(row, 3)}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field full"><label>Lý do</label><input data-field="reason" value="${rowText(row, 3)}"></div>
            </div>
            <h3 class="section-title edit-section-title" style="display:flex; justify-content:space-between; align-items:center;">Chi tiết đổi hàng <button class="sales-btn primary" data-add-exchange-product type="button" style="padding: 4px 8px; font-size: 0.9em;"><i class='bx bx-plus'></i></button></h3>
            <div class="product-list-container">
                <div class="form-grid edit-grid product-row" style="position: relative; padding-right: 40px; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                    <div class="field"><label>SP cũ (Trả)</label><select data-field="oldProduct">${oldProductOptions}</select></div>
                    <div class="field" style="position: relative;">
                        <label>SP mới (Đổi)</label>
                        <div class="product-combobox" data-product-combobox>
                            <input type="text" data-product-search placeholder="Tìm hoặc chọn SP..." value="${newProduct}">
                            <button type="button" class="combo-toggle" data-product-toggle><i class='bx bx-chevron-down'></i></button>
                            <input type="hidden" data-product-value value="${newProduct}">
                            <div class="combo-options" data-product-options></div>
                        </div>
                    </div>
                    <div class="field"><label>Số lượng</label><input type="number" min="1" data-field="quantity" value="${quantity}"></div>
                    <div class="field"><label>Bù/hoàn dòng</label><input data-field="rowExchangeRefund" value="0đ" readonly style="background-color: #eef2f5; color: #666;"></div>
                    <button class="action-btn delete" data-remove-row type="button" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: none; color: #ff4d4f; font-size: 1.2em; cursor: pointer;"><i class='bx bx-trash'></i></button>
                </div>
            </div>
            <div class="field full" style="margin-top: 10px;">
                <label>Tổng tiền hoàn/bù</label>
                <input data-field="exchangeRefund" value="0đ" readonly style="background-color: #eef2f5; color: #666; font-weight: bold; font-size: 1.1em;">
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary" data-save-edit="exchange">Lưu thay đổi</button>`);

        delete modal.dataset.productComboReady;
        setupProductCombobox(modal);

        const container = modal.querySelector('.product-list-container');
        const refundInput = modal.querySelector('[data-field="exchangeRefund"]');
        
        const updateExchangeRefund = () => {
            let totalRefund = 0;
            const rows = container.querySelectorAll('.product-row');
            rows.forEach(r => {
                const oldSelect = r.querySelector('[data-field="oldProduct"]');
                const newValueInput = r.querySelector('[data-product-value]');
                const newSearchInput = r.querySelector('[data-product-search]');
                const qtyInput = r.querySelector('[data-field="quantity"]');
                const rowRefundInput = r.querySelector('[data-field="rowExchangeRefund"]');
                
                let refund = 0;
                const oldOption = oldSelect.options[oldSelect.selectedIndex];
                if (oldOption) {
                    const maxQty = parseInt(oldOption.dataset.max, 10) || 1;
                    let qty = parseInt(qtyInput.value, 10) || 1;
                    if (qty > maxQty) { qty = maxQty; qtyInput.value = qty; }
                    if (qty < 1) { qty = 1; qtyInput.value = 1; }
                    refund -= (parseFloat(oldOption.dataset.price) || 0) * qty;
                }
                
                let newQty = parseInt(qtyInput.value, 10) || 1;
                if (newValueInput.value && productDetails[newValueInput.value]) {
                    const newPrice = productDetails[newValueInput.value].priceNum || 0;
                    refund += newPrice * newQty;
                } else if (newSearchInput && newSearchInput.value === newProduct && row.dataset.newProductId) {
                    refund += 0; 
                }
                
                rowRefundInput.dataset.rawTotal = refund;
                rowRefundInput.value = formatMoney(refund);
                totalRefund += refund;
            });
            
            refundInput.dataset.rawTotal = totalRefund;
            refundInput.value = formatMoney(totalRefund);
            if (totalRefund > 0) refundInput.style.color = '#ff4d4f'; 
            else if (totalRefund < 0) refundInput.style.color = '#52c41a'; 
            else refundInput.style.color = '#666';
        };

        const attachRowEvents = (r) => {
            const oldSelect = r.querySelector('[data-field="oldProduct"]');
            const newValueInput = r.querySelector('[data-product-value]');
            const qtyInput = r.querySelector('[data-field="quantity"]');
            
            oldSelect.addEventListener('change', () => {
                const opt = oldSelect.options[oldSelect.selectedIndex];
                if (opt) {
                    qtyInput.max = opt.dataset.max;
                    qtyInput.value = '1';
                }
                updateExchangeRefund();
            });
            qtyInput.addEventListener('input', updateExchangeRefund);
            newValueInput.addEventListener('change', updateExchangeRefund);
        };

        const firstRow = container.querySelector('.product-row');
        attachRowEvents(firstRow);
        const initialOpt = firstRow.querySelector('[data-field="oldProduct"]').options[firstRow.querySelector('[data-field="oldProduct"]').selectedIndex];
        if (initialOpt) firstRow.querySelector('[data-field="quantity"]').max = initialOpt.dataset.max;
        updateExchangeRefund(); 

        modal.querySelector('[data-add-exchange-product]').onclick = () => {
            const newRow = document.createElement('div');
            newRow.className = 'form-grid edit-grid product-row';
            newRow.style.cssText = 'position: relative; padding-right: 40px; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 10px;';
            newRow.innerHTML = `
                <div class="field"><label>SP cũ (Trả)</label><select data-field="oldProduct">${oldProductOptions}</select></div>
                <div class="field" style="position: relative;">
                    <label>SP mới (Đổi)</label>
                    <div class="product-combobox" data-product-combobox>
                        <input type="text" data-product-search placeholder="Tìm hoặc chọn SP..." value="">
                        <button type="button" class="combo-toggle" data-product-toggle><i class='bx bx-chevron-down'></i></button>
                        <input type="hidden" data-product-value value="">
                        <div class="combo-options" data-product-options></div>
                    </div>
                </div>
                <div class="field"><label>Số lượng</label><input type="number" min="1" data-field="quantity" value="1"></div>
                <div class="field"><label>Bù/hoàn dòng</label><input data-field="rowExchangeRefund" value="0đ" readonly style="background-color: #eef2f5; color: #666;"></div>
                <button class="action-btn delete" data-remove-row type="button" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: none; color: #ff4d4f; font-size: 1.2em; cursor: pointer;"><i class='bx bx-trash'></i></button>
            `;
            container.appendChild(newRow);
            attachRowEvents(newRow);
            
            delete modal.dataset.productComboReady;
            setupProductCombobox(modal);
            
            const oldSelect = newRow.querySelector('[data-field="oldProduct"]');
            if (oldSelect.options.length > 0) oldSelect.selectedIndex = 0;
            const opt = oldSelect.options[oldSelect.selectedIndex];
            if (opt) newRow.querySelector('[data-field="quantity"]').max = opt.dataset.max;
            updateExchangeRefund();
        };

        modal.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('[data-remove-row]');
            if (removeBtn) {
                removeBtn.closest('.product-row').remove();
                updateExchangeRefund();
            }
        });

        modal.querySelector('[data-save-edit="exchange"]').onclick = async () => {
            const reason = fieldValue(modal, 'reason');
            const id = parseInt(code.replace(/\D/g, ''), 10);
            const totalRefund = parseFloat(refundInput.dataset.rawTotal || 0);
            
            const items = [];
            container.querySelectorAll('.product-row').forEach(r => {
                const oldPid = r.querySelector('[data-field="oldProduct"]').value;
                const newPName = r.querySelector('[data-product-value]').value;
                const newPid = productDetails[newPName]?.productId || row.dataset.newProductId || 0;
                const qty = parseInt(r.querySelector('[data-field="quantity"]').value, 10) || 1;
                items.push({ old_product_id: oldPid, new_product_id: newPid, quantity: qty });
            });

            if (items.length === 0) {
                alert('Vui lòng chọn ít nhất 1 sản phẩm.');
                return;
            }

            if (window.kidCityApi) {
                try {
                    await window.kidCityApi.put('sales/exchanges.php', { 
                        id, 
                        reason,
                        items,
                        exchange_refund: totalRefund
                    });
                    await loadExchangeTableFromApi();
                    closeModal(modal);
                } catch (e) {
                    alert(e.message || 'Lỗi cập nhật phiếu đổi hàng');
                }
            } else {
                row.dataset.reason = reason;
                row.dataset.updatedAt = today();
                row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(invoiceCode)}</td><td>${fieldValue(modal, 'date')}</td><td>${reason}</td><td>${fieldValue(modal, 'staff')}</td><td></td>`;
                attachActions(row.lastElementChild, 'exchange', 'exchange-detail');
                updateRowKey(row);
                closeModal(modal);
            }
        };
    };
const openReturnEditModal = (row) => {
        const code = rowText(row, 0);
        const invoiceCode = rowText(row, 1);
        const product = row.dataset.product || '';
        const quantity = row.dataset.quantity || '1';
        const refund = row.dataset.refund || '0đ';
        
        const invoice = invoiceDetails[invoiceCode] || {};
        const items = invoice.items || [];
        
        let productOptions = items.map(item => `<option value="${item[5]}" data-name="${item[0]}" data-price="${item[6]}" data-max="${item[2]}" ${item[0] === product || String(item[5]) === String(row.dataset.productId) ? 'selected' : ''}>${item[0]} (Tối đa: ${item[2]})</option>`).join('');
        if (!productOptions) productOptions = `<option value="${row.dataset.productId || ''}" data-name="${product}" data-price="0" data-max="${quantity}" selected>${product}</option>`;

        const modal = showWorkModal('return-edit-modal', `Sửa phiếu trả ${code}`, `
            <div class="form-grid edit-grid">
                <div class="field"><label>Mã trả hàng</label><input data-field="code" value="${code}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Mã hóa đơn</label><input data-field="invoiceCode" value="${invoiceCode}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Ngày trả</label><input type="date" data-field="date" value="${rowText(row, 2)}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field"><label>Nhân viên xử lý</label><input data-field="staff" value="${rowText(row, 4)}" disabled style="background-color: #eef2f5; color: #666;"></div>
                <div class="field full"><label>Lý do</label><input data-field="reason" value="${rowText(row, 3)}"></div>
            </div>
            <h3 class="section-title edit-section-title" style="display:flex; justify-content:space-between; align-items:center;">Chi tiết sản phẩm trả <button class="sales-btn primary" data-add-return-product type="button" style="padding: 4px 8px; font-size: 0.9em;"><i class='bx bx-plus'></i></button></h3>
            <div class="product-list-container">
                <div class="form-grid edit-grid product-row" style="position: relative; padding-right: 40px; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 10px;">
                    <div class="field"><label>Sản phẩm</label><select data-field="product">${productOptions}</select></div>
                    <div class="field"><label>Số lượng trả</label><input type="number" min="1" data-field="quantity" value="${quantity}"></div>
                    <div class="field"><label>Tiền hoàn</label><input data-field="rowRefund" value="${refund}" readonly style="background-color: #eef2f5; color: #666;"></div>
                    <button class="action-btn delete" data-remove-row type="button" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: none; color: #ff4d4f; font-size: 1.2em; cursor: pointer;"><i class='bx bx-trash'></i></button>
                </div>
            </div>
            <div class="field full" style="margin-top: 10px;">
                <label>Tổng tiền hoàn</label>
                <input data-field="refund" value="${refund}" readonly style="background-color: #eef2f5; color: #52c41a; font-weight: bold; font-size: 1.1em;">
            </div>
        `, `<button class="sales-btn light" data-close>Hủy</button><button class="sales-btn primary" data-save-edit="return">Lưu thay đổi</button>`);

        const container = modal.querySelector('.product-list-container');
        const refundInput = modal.querySelector('[data-field="refund"]');
        
        const updateRefundAmount = () => {
            let totalRefund = 0;
            const rows = container.querySelectorAll('.product-row');
            rows.forEach(r => {
                const pSelect = r.querySelector('[data-field="product"]');
                const qInput = r.querySelector('[data-field="quantity"]');
                const rowRefundInput = r.querySelector('[data-field="rowRefund"]');
                
                const selectedOption = pSelect.options[pSelect.selectedIndex];
                if (!selectedOption) return;
                
                const price = parseFloat(selectedOption.dataset.price) || 0;
                const maxQty = parseInt(selectedOption.dataset.max, 10) || 1;
                
                let qty = parseInt(qInput.value, 10) || 1;
                if (qty > maxQty) { qty = maxQty; qInput.value = qty; }
                if (qty < 1) { qty = 1; qInput.value = 1; }
                
                const rowTotal = price * qty;
                rowRefundInput.value = formatMoney(rowTotal);
                rowRefundInput.dataset.rawTotal = rowTotal;
                totalRefund += rowTotal;
            });
            
            refundInput.dataset.rawTotal = totalRefund;
            refundInput.value = formatMoney(totalRefund);
        };

        const attachRowEvents = (r) => {
            const pSelect = r.querySelector('[data-field="product"]');
            const qInput = r.querySelector('[data-field="quantity"]');
            
            pSelect.addEventListener('change', () => {
                const selectedOption = pSelect.options[pSelect.selectedIndex];
                if (selectedOption) {
                    qInput.max = selectedOption.dataset.max;
                    qInput.value = '1';
                }
                updateRefundAmount();
            });
            qInput.addEventListener('input', updateRefundAmount);
        };

        const firstRow = container.querySelector('.product-row');
        attachRowEvents(firstRow);
        const initialSelected = firstRow.querySelector('[data-field="product"]').options[firstRow.querySelector('[data-field="product"]').selectedIndex];
        if (initialSelected) firstRow.querySelector('[data-field="quantity"]').max = initialSelected.dataset.max;
        updateRefundAmount();

        modal.querySelector('[data-add-return-product]').onclick = () => {
            const newRow = document.createElement('div');
            newRow.className = 'form-grid edit-grid product-row';
            newRow.style.cssText = 'position: relative; padding-right: 40px; margin-bottom: 10px; border-bottom: 1px dashed #eee; padding-bottom: 10px;';
            newRow.innerHTML = `
                <div class="field"><label>Sản phẩm</label><select data-field="product">${productOptions}</select></div>
                <div class="field"><label>Số lượng trả</label><input type="number" min="1" data-field="quantity" value="1"></div>
                <div class="field"><label>Tiền hoàn</label><input data-field="rowRefund" value="0đ" readonly style="background-color: #eef2f5; color: #666;"></div>
                <button class="action-btn delete" data-remove-row type="button" style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: none; border: none; color: #ff4d4f; font-size: 1.2em; cursor: pointer;"><i class='bx bx-trash'></i></button>
            `;
            container.appendChild(newRow);
            attachRowEvents(newRow);
            
            const pSelect = newRow.querySelector('[data-field="product"]');
            if (pSelect.options.length > 0) pSelect.selectedIndex = 0;
            const opt = pSelect.options[pSelect.selectedIndex];
            if (opt) newRow.querySelector('[data-field="quantity"]').max = opt.dataset.max;
            updateRefundAmount();
        };

        modal.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('[data-remove-row]');
            if (removeBtn) {
                removeBtn.closest('.product-row').remove();
                updateRefundAmount();
            }
        });

        modal.querySelector('[data-save-edit="return"]').onclick = async () => {
            const reason = fieldValue(modal, 'reason');
            const id = parseInt(code.replace(/\D/g, ''), 10);
            const totalRefund = parseFloat(refundInput.dataset.rawTotal || 0);
            
            const items = [];
            container.querySelectorAll('.product-row').forEach(r => {
                const pid = r.querySelector('[data-field="product"]').value;
                const qty = parseInt(r.querySelector('[data-field="quantity"]').value, 10) || 1;
                const rowRefund = parseFloat(r.querySelector('[data-field="rowRefund"]').dataset.rawTotal || 0);
                items.push({ product_id: pid, quantity: qty, refund_amount: rowRefund });
            });

            if (items.length === 0) {
                alert('Vui lòng chọn ít nhất 1 sản phẩm.');
                return;
            }

            if (window.kidCityApi) {
                try {
                    await window.kidCityApi.put('sales/returns.php', { 
                        id, 
                        reason,
                        items,
                        refund_amount: totalRefund
                    });
                    await loadReturnTableFromApi();
                    closeModal(modal);
                } catch (e) {
                    alert(e.message || 'Lỗi cập nhật phiếu trả hàng');
                }
            } else {
                row.dataset.reason = reason;
                row.dataset.updatedAt = today();
                row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceLink(invoiceCode)}</td><td>${fieldValue(modal, 'date')}</td><td>${reason}</td><td>${fieldValue(modal, 'staff')}</td><td></td>`;
                attachActions(row.lastElementChild, 'return', 'return-detail');
                updateRowKey(row);
                closeModal(modal);
            }
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
            <td><input type="number" class="draft-qty-input" min="1" value="${quantity}" style="width: 60px; text-align: center; border: 1px solid #dbe4f0; border-radius: 4px; padding: 4px;"></td>
            <td>${formatMoney(price)}</td>
            <td class="draft-item-total"><strong>${formatMoney(price * quantity)}</strong></td>
            <td>
                <div class="draft-actions">
                    <button class="draft-action delete" data-delete-draft-product title="Xóa sản phẩm"><i class='bx bx-trash'></i></button>
                </div>
            </td>
        `;

        const qtyInput = row.querySelector('.draft-qty-input');
        qtyInput.addEventListener('input', (e) => {
            const newQty = Math.max(1, Number(e.target.value) || 1);
            row.dataset.quantity = String(newQty);
            row.querySelector('.draft-item-total strong').textContent = formatMoney(price * newQty);
            updateInvoiceSummary(row.closest('#invoice-create'));
        });
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
            if (!discountInput.dataset.manualOverride) {
                discountInput.value = subtotal > 1000000 ? formatMoney(Math.round(subtotal * 0.1)) : '0đ';
            }
        }

        let discount = moneyNumber(discountInput?.value);
        const maxDiscount = Math.round(subtotal * 0.15);
        const errorSpan = modal.querySelector('.discount-error');

        if (discount > maxDiscount) {
            discount = maxDiscount;
            if (discountInput) {
                discountInput.value = formatMoney(discount);
                discountInput.style.borderColor = 'red';
            }
            if (errorSpan) {
                errorSpan.style.display = 'block';
                const maxValSpan = errorSpan.querySelector('.max-discount-val');
                if (maxValSpan) maxValSpan.textContent = formatMoney(maxDiscount);
            }
        } else {
            if (discountInput) discountInput.style.borderColor = '';
            if (errorSpan) errorSpan.style.display = 'none';
        }

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
        hideSelectedProductInfo(modal);
        modal.querySelector('[data-product-search]').focus();
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
            const deleteBtn = event.target.closest('[data-delete-draft-product]');
            if (deleteBtn) openDraftDeleteModal(deleteBtn.closest('tr'));
        });
    };

    const createInvoice = async () => {
        const modal = root.querySelector('#invoice-create');
        const customerValue = modal.querySelector('[data-customer-value]');
        const customerInput = modal.querySelector('[data-customer-search]');
        const dateInput = modal.querySelector('#invoice-date-input');
        const productRows = Array.from(modal.querySelectorAll('.sales-card tbody tr')).filter((row) => !row.querySelector('.empty-row'));
        
        const customerId = customerValue ? Number(customerValue.dataset.customerId || 0) : 0;
        const customerText = customerValue ? customerValue.value.trim() : '';

        if (!customerText || !customerId) {
            const errorSpan = modal.querySelector('.invoice-customer-field .error-message');
            if (errorSpan) errorSpan.style.display = 'block';
            if (customerInput) {
                customerInput.style.borderColor = 'red';
                customerInput.focus();
            }
            return;
        }
        if (!productRows.length) {
            alert('Vui lòng thêm ít nhất một sản phẩm.');
            return;
        }

        updateInvoiceSummary(modal);
        const total = moneyNumber(modal.querySelector('[data-invoice-total]')?.textContent);
        
        let invoiceDate = today();
        if (dateInput && dateInput.value) {
            const parts = dateInput.value.split('/');
            if (parts.length === 3) {
                invoiceDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        if (window.kidCityApi) {
            try {
                await window.kidCityApi.post('sales/invoices.php', {
                    customer_id: customerId,
                    invoice_date: invoiceDate,
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
        const customer = customerText;
        const body = root.querySelector('#invoice-table');
        const row = document.createElement('tr');
        row.dataset.key = normalize(`${code} ${customer} Nguyễn Văn An`);
        row.innerHTML = `<td><strong>${code}</strong></td><td>${invoiceDate}</td><td>${customer}</td><td>Nguyễn Văn An</td><td></td>`;
        attachActions(row.lastElementChild, 'invoice', 'invoice-detail');
        body.prepend(row);

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const date = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const dbTime = `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;

        const formattedCreated = `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        const initialSnapshot = {
            customer: customer,
            staff: 'Nguyễn Văn An',
            date: invoiceDate,
            note: modal.querySelector('.form-grid input[placeholder="Ghi chú hóa đơn (tùy chọn)..."]')?.value.trim() || 'Không có',
            total: formatMoney(total),
            items: productRows.map((row) => [
                row.dataset.product,
                formatMoney(row.dataset.price),
                row.dataset.quantity,
                '0đ',
                formatMoney(Number(row.dataset.price) * Number(row.dataset.quantity)),
                Number(row.dataset.productId || 0),
                Number(row.dataset.price || 0)
            ]),
            timestamp: formattedCreated
        };

        invoiceDetails[code] = {
            id: 0,
            customer: customer,
            staff: 'Nguyễn Văn An',
            date: invoiceDate,
            createdAt: dbTime,
            updatedAt: dbTime,
            updateHistory: [],
            historySnapshots: [initialSnapshot],
            note: initialSnapshot.note,
            total: initialSnapshot.total,
            items: initialSnapshot.items
        };

        updateFirstStat(countRows('#invoice-table'));
        invoiceCurrentPage = 1;
        renderInvoicePagination();
        closeModal(modal);
    };

    const openInvoiceCustomerModal = () => {
        const invoiceModal = root.querySelector('#invoice-create');
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

        modal.querySelector('[data-save-invoice-customer]').onclick = async () => {
            const name = fieldValue(modal, 'customerName').trim();
            const phone = fieldValue(modal, 'customerPhone').trim();
            if (!name || !phone) {
                alert('Vui lòng nhập đầy đủ tên và số điện thoại khách hàng.');
                return;
            }

            const existingPhone = invoiceCustomerOptions.find((c) => c.phone === phone);
            if (existingPhone) {
                alert('Số điện thoại này đã tồn tại trong hệ thống. Vui lòng kiểm tra lại!');
                return;
            }

            let newCustomerId = Date.now();
            if (window.kidCityApi) {
                try {
                    const res = await window.kidCityApi.post('customers/index.php', { name, phone });
                    if (res && res.id) {
                        newCustomerId = res.id;
                    }
                } catch (e) {
                    alert(e.message || 'Không thể tạo khách hàng mới trên hệ thống.');
                    return;
                }
            }

            const newCustomer = {
                id: newCustomerId,
                name: name,
                phone: phone
            };
            invoiceCustomerOptions.push(newCustomer);
            
            setInvoiceCustomer(invoiceModal, name);
            const valueInput = invoiceModal.querySelector('[data-customer-value]');
            if (valueInput) valueInput.dataset.customerId = newCustomer.id;

            closeModal(modal);
        };
    };
    const bindInvoicePage = () => {
        showTableLoading('#invoice-table', 5);
        bindInvoicePagination();
        renderInvoicePagination();
        loadInvoiceFormDataFromApi();
        loadInvoiceTableFromApi();
        setupProductCombobox(root.querySelector('#invoice-create'));
        initInvoiceCustomerCombobox();
        root.querySelector('#invoice-create .add-product .sales-btn.primary').addEventListener('click', addInvoiceProduct);
        root.querySelector('#invoice-create [data-invoice-discount]')?.addEventListener('input', (event) => {
            event.target.dataset.manualOverride = 'true';
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
        
        const customerInput = root.querySelector('#invoice-create .invoice-customer-field [data-customer-search]');
        if (customerInput) {
            customerInput.addEventListener('input', () => {
                const errorSpan = customerInput.closest('.field').querySelector('.error-message');
                if (errorSpan) errorSpan.style.display = 'none';
                customerInput.style.borderColor = '';
            });
        }
        
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
        const newSelectValue = modal.querySelector('.swap-panel.new [data-product-value]');
        const newQty = modal.querySelector('.swap-panel.new input[type="number"]');
        
        if (returnSelect && oldSelect) {
            Array.from(returnSelect.options).forEach(opt => {
                if (!opt.value) return;
                opt.disabled = oldSelect.value === opt.value;
            });
            Array.from(oldSelect.options).forEach(opt => {
                if (!opt.value) return;
                opt.disabled = returnSelect.value === opt.value;
            });
        }
        
        let returnRefund = 0;
        let exchangeRefund = 0;
        if (validSelect(returnSelect)) returnRefund = (prices[returnSelect.value] || 100000) * Math.max(1, Number(returnQty?.value || 1));
        if (validSelect(oldSelect)) exchangeRefund += (prices[oldSelect.value] || 100000) * Math.max(1, Number(oldQty?.value || 1));
        if (newSelectValue && newSelectValue.value) exchangeRefund -= (prices[newSelectValue.value] || 100000) * Math.max(1, Number(newQty?.value || 1));
        
        const totalRefund = returnRefund + exchangeRefund;
        
        const returnTotalEl = modal.querySelector('#exchange-return-refund');
        if (returnTotalEl) returnTotalEl.textContent = formatMoney(returnRefund);
        
        const exchangeTotalEl = modal.querySelector('#exchange-exchange-refund');
        if (exchangeTotalEl) exchangeTotalEl.textContent = formatMoney(exchangeRefund);
        
        const totalRefundEl = modal.querySelector('#exchange-total-refund');
        if (totalRefundEl) totalRefundEl.textContent = formatMoney(totalRefund);
    };

    const createExchange = async () => {
        const modal = root.querySelector('#exchange-create');
        const invoiceSelect = getInvoiceControl(modal);
        const dateInput = modal.querySelector('[data-current-date]');
        const noteInput = getNoteInput(modal);
        
        const returnPanel = modal.querySelector('.swap-panel.return-only');
        const oldPanel = modal.querySelector('.swap-panel.old');
        const newPanel = modal.querySelector('.swap-panel.new');
        
        const returnSelect = returnPanel.querySelector('select');
        const oldSelect = oldPanel.querySelector('select');
        const newSelect = newPanel.querySelector('[data-product-value]');

        if (!validSelect(invoiceSelect)) {
            alert('Vui lòng chọn hóa đơn gốc.');
            return;
        }
        if (!validSelect(returnSelect) && !(validSelect(oldSelect) && validSelect(newSelect))) {
            alert('Vui lòng chọn ít nhất 1 sản phẩm trả lại hoặc 1 cặp sản phẩm đổi.');
            return;
        }
        if (validSelect(returnSelect) && isProductAlreadyProcessed(invoiceSelect.value, invoiceProductId(invoiceSelect.value, returnSelect.value))) {
            alert(`Sản phẩm '${returnSelect.value}' đã được đổi/trả trước đó.`);
            return;
        }
        if (validSelect(oldSelect) && isProductAlreadyProcessed(invoiceSelect.value, invoiceProductId(invoiceSelect.value, oldSelect.value))) {
            alert(`Sản phẩm '${oldSelect.value}' đã được đổi/trả trước đó.`);
            return;
        }

        const invoiceCode = invoiceSelect.value;
        const date = dateInput ? dateInput.value.split(' ')[0] : today();
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
                if (validSelect(oldSelect) && newSelect && newSelect.value) {
                    let exchangeRefund = 0;
                    exchangeRefund -= (prices[oldSelect.value] || 100000) * Math.max(1, Number(oldPanel.querySelector('input').value || 1));
                    exchangeRefund += (prices[newSelect.value] || 100000) * Math.max(1, Number(newPanel.querySelector('input[type="number"]').value || 1));
                    await window.kidCityApi.post('sales/exchanges.php', {
                        invoice_id: invoiceIdByCode(invoiceCode),
                        old_product_id: invoiceProductId(invoiceCode, oldSelect.value),
                        new_product_id: productDetails[newSelect.value]?.productId || 0,
                        exchange_date: date,
                        quantity: Math.max(1, Number(oldPanel.querySelector('input').value || 1)),
                        reason: reason + ' (Đổi)',
                        type: 'Đổi hàng',
                        exchange_refund: exchangeRefund
                    });
                }
                closeModal(modal);
                await loadExchangeTableFromApi();
                if (typeof loadReturnTableFromApi === 'function') await loadReturnTableFromApi();
                alert('Tạo phiếu thành công!');
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
        loadInvoiceFormDataFromApi();
        const modal = root.querySelector('#exchange-create');
        const invoiceSelect = enhanceInvoiceControl(modal, 'exchange-invoice-combo', '.swap-panel.return-only, .swap-panel.old');
        setupProductCombobox(modal);
        
        invoiceSelect?.addEventListener('change', () => { 
            syncInvoiceProductPanel(modal, '.swap-panel.return-only, .swap-panel.old');
            updateExchangeRefund(); 
        });
        modal.querySelector('.swap-panel.return-only select')?.addEventListener('change', updateExchangeRefund);
        modal.querySelector('.swap-panel.return-only input')?.addEventListener('input', updateExchangeRefund);
        modal.querySelector('.swap-panel.old select')?.addEventListener('change', updateExchangeRefund);
        modal.querySelector('.swap-panel.old input')?.addEventListener('input', updateExchangeRefund);
        modal.querySelector('.swap-panel.new [data-product-value]')?.addEventListener('change', updateExchangeRefund);
        modal.querySelector('.swap-panel.new input[type="number"]')?.addEventListener('input', updateExchangeRefund);
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
        const newSelectValue = modal.querySelector('.swap-panel.new [data-product-value]');
        const newQty = modal.querySelector('.swap-panel.new input[type="number"]');
        
        if (returnSelect && oldSelect) {
            Array.from(returnSelect.options).forEach(opt => {
                if (!opt.value) return;
                opt.disabled = oldSelect.value === opt.value;
            });
            Array.from(oldSelect.options).forEach(opt => {
                if (!opt.value) return;
                opt.disabled = returnSelect.value === opt.value;
            });
        }
        
        let returnRefund = 0;
        let exchangeRefund = 0;
        if (validSelect(returnSelect)) returnRefund = (prices[returnSelect.value] || 100000) * Math.max(1, Number(returnQty?.value || 1));
        if (validSelect(oldSelect)) exchangeRefund += (prices[oldSelect.value] || 100000) * Math.max(1, Number(oldQty?.value || 1));
        if (newSelectValue && newSelectValue.value) exchangeRefund -= (prices[newSelectValue.value] || 100000) * Math.max(1, Number(newQty?.value || 1));
        
        const totalRefund = returnRefund + exchangeRefund;
        
        const returnTotalEl = modal.querySelector('#return-return-refund');
        if (returnTotalEl) returnTotalEl.textContent = formatMoney(returnRefund);
        
        const exchangeTotalEl = modal.querySelector('#return-exchange-refund');
        if (exchangeTotalEl) exchangeTotalEl.textContent = formatMoney(exchangeRefund);
        
        const totalRefundEl = modal.querySelector('#return-total-refund');
        if (totalRefundEl) totalRefundEl.textContent = formatMoney(totalRefund);
    };

    const createReturn = async () => {
        const modal = root.querySelector('#return-create');
        const invoiceSelect = getInvoiceControl(modal);
        const dateInput = modal.querySelector('[data-current-date]');
        const noteInput = getNoteInput(modal);
        
        const returnPanel = modal.querySelector('.swap-panel.return-only');
        const oldPanel = modal.querySelector('.swap-panel.old');
        const newPanel = modal.querySelector('.swap-panel.new');
        
        const returnSelect = returnPanel.querySelector('select');
        const oldSelect = oldPanel.querySelector('select');
        const newSelect = newPanel.querySelector('[data-product-value]');

        if (!validSelect(invoiceSelect)) {
            alert('Vui lòng chọn hóa đơn gốc.');
            return;
        }
        if (!validSelect(returnSelect) && !(validSelect(oldSelect) && validSelect(newSelect))) {
            alert('Vui lòng chọn ít nhất 1 sản phẩm trả lại hoặc 1 cặp sản phẩm đổi.');
            return;
        }
        if (validSelect(returnSelect) && isProductAlreadyProcessed(invoiceSelect.value, invoiceProductId(invoiceSelect.value, returnSelect.value))) {
            alert(`Sản phẩm '${returnSelect.value}' đã được đổi/trả trước đó.`);
            return;
        }
        if (validSelect(oldSelect) && isProductAlreadyProcessed(invoiceSelect.value, invoiceProductId(invoiceSelect.value, oldSelect.value))) {
            alert(`Sản phẩm '${oldSelect.value}' đã được đổi/trả trước đó.`);
            return;
        }

        const invoiceCode = invoiceSelect.value;
        const date = dateInput ? dateInput.value.split(' ')[0] : today();
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
                if (validSelect(oldSelect) && newSelect && newSelect.value) {
                    let exchangeRefund = 0;
                    exchangeRefund -= (prices[oldSelect.value] || 100000) * Math.max(1, Number(oldPanel.querySelector('input').value || 1));
                    exchangeRefund += (prices[newSelect.value] || 100000) * Math.max(1, Number(newPanel.querySelector('input[type="number"]').value || 1));
                    await window.kidCityApi.post('sales/exchanges.php', {
                        invoice_id: invoiceIdByCode(invoiceCode),
                        old_product_id: invoiceProductId(invoiceCode, oldSelect.value),
                        new_product_id: productDetails[newSelect.value]?.productId || 0,
                        exchange_date: date,
                        quantity: Math.max(1, Number(oldPanel.querySelector('input').value || 1)),
                        reason: reason + ' (Đổi)',
                        type: 'Đổi hàng',
                        exchange_refund: exchangeRefund
                    });
                }
                closeModal(modal);
                await loadReturnTableFromApi();
                if (typeof loadExchangeTableFromApi === 'function') await loadExchangeTableFromApi();
                alert('Tạo phiếu thành công!');
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
        loadInvoiceFormDataFromApi();
        const modal = root.querySelector('#return-create');
        const invoiceSelect = enhanceInvoiceControl(modal, 'return-invoice-combo', '.swap-panel.return-only, .swap-panel.old');
        setupProductCombobox(modal);
        
        invoiceSelect?.addEventListener('change', () => { 
            syncInvoiceProductPanel(modal, '.swap-panel.return-only');
            syncInvoiceProductPanel(modal, '.swap-panel.old');
            updateReturnRefund(); 
        });
        modal.querySelector('.swap-panel.return-only select')?.addEventListener('change', updateReturnRefund);
        modal.querySelector('.swap-panel.return-only input')?.addEventListener('input', updateReturnRefund);
        modal.querySelector('.swap-panel.old select')?.addEventListener('change', updateReturnRefund);
        modal.querySelector('.swap-panel.old input')?.addEventListener('input', updateReturnRefund);
        modal.querySelector('.swap-panel.new [data-product-value]')?.addEventListener('change', updateReturnRefund);
        modal.querySelector('.swap-panel.new input[type="number"]')?.addEventListener('input', updateReturnRefund);
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
