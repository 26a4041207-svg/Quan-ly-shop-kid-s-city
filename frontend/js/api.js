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
})();
