(function () {
    const apiUrl = (path) => {
        const normalized = String(path || '').replace(/^\/+/, '');
        if (window.KID_CITY_API_BASE) {
            return `${String(window.KID_CITY_API_BASE).replace(/\/+$/, '')}/${normalized}`;
        }
        const pathname = window.location.pathname.replace(/\\/g, '/');
        const frontendIndex = pathname.indexOf('/frontend/');
        const projectBase = frontendIndex >= 0 ? pathname.slice(0, frontendIndex) : pathname.replace(/\/[^/]*$/, '');
        return `${projectBase}/backend/api/${normalized}`;
    };

    const token = () => localStorage.getItem('authToken') || '';

    window.kidCityApi = {
        async request(path, options = {}) {
            const headers = {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            };

            if (token()) {
                headers.Authorization = `Bearer ${token()}`;
            }

            const response = await fetch(apiUrl(path), {
                ...options,
                headers
            });
            const payload = await response.json().catch(() => ({
                success: false,
                message: 'Không đọc được phản hồi từ máy chủ.'
            }));

            if (!response.ok || payload.success === false) {
                const error = new Error(payload.message || 'Có lỗi xảy ra.');
                error.payload = payload;
                error.status = response.status;
                if (response.status === 401) {
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('currentRole');
                    localStorage.removeItem('authToken');
                    const loginPath = window.getKidCityLoginPath ? window.getKidCityLoginPath() : './login.html';
                    if (!window.location.pathname.endsWith('/login.html')) {
                        window.location.replace(loginPath);
                    }
                }
                throw error;
            }

            return payload.data;
        },

        get(path) {
            return this.request(path);
        },

        post(path, data) {
            return this.request(path, {
                method: 'POST',
                body: JSON.stringify(data || {})
            });
        },

        put(path, data) {
            return this.request(path, {
                method: 'PUT',
                body: JSON.stringify(data || {})
            });
        },

        delete(path) {
            return this.request(path, { method: 'DELETE' });
        }
    };

    if (!document.getElementById('global-toast')) {
        const toastDiv = document.createElement('div');
        toastDiv.id = 'global-toast';
        toastDiv.style.position = 'fixed';
        toastDiv.style.top = '20px';
        toastDiv.style.right = '-300px';
        toastDiv.style.background = '#dcfce7';
        toastDiv.style.color = '#166534';
        toastDiv.style.padding = '12px 20px';
        toastDiv.style.borderRadius = '8px';
        toastDiv.style.fontSize = '14px';
        toastDiv.style.fontWeight = '500';
        toastDiv.style.display = 'flex';
        toastDiv.style.alignItems = 'center';
        toastDiv.style.gap = '8px';
        toastDiv.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        toastDiv.style.zIndex = '9999';
        toastDiv.style.transition = 'right 0.4s ease-in-out';
        toastDiv.innerHTML = `<i class='bx bx-check-circle' style='font-size: 20px; color: #16a34a;'></i> <span id="toast-message">Thành công!</span>`;
        document.body.appendChild(toastDiv);
    }

    window.showToast = function (message) {
        const toast = document.getElementById('global-toast');
        const toastMsg = document.getElementById('toast-message');
        if (!toast || !toastMsg) return;
        toastMsg.innerText = message;
        toast.style.right = '20px';
        setTimeout(() => {
            toast.style.right = '-300px';
        }, 3000);
    };
})();
