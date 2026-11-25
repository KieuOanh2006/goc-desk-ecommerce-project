(() => {
    const sections = new Map([
        ['dashboard', { url: 'admin-dashboard.html', label: 'Dashboard' }],
        ['products', { url: 'admin-products.html', label: 'Sản phẩm' }],
        ['customers', { url: 'admin-customers.html', label: 'Khách hàng' }],
        ['staff', { url: 'admin-staff.html', label: 'Nhân viên' }],
    ]);
    const roles = new Map([
        ['admin', { home: 'dashboard', label: 'Admin', sections: [...sections.keys()] }],
        ['product_content_staff', { home: 'products', label: 'Nhân viên sản phẩm và nội dung', sections: ['products'] }],
        ['order_support_staff', { home: 'customers', label: 'Nhân viên hỗ trợ đơn hàng', sections: ['customers'] }],
    ]);
    const loginUrl = 'account.html#admin';
    const area = document.querySelector('[data-admin-role]');
    const section = area?.dataset.adminRole;
    let currentRole;

    function homeFor(role) {
        return sections.get(roles.get(role)?.home)?.url;
    }

    function canManage(target) {
        return section === target && roles.get(currentRole)?.sections.includes(target) === true;
    }

    function getApiEndpoint(path) {
        const defaultBase = location.protocol === 'https:'
            ? location.origin
            : `http://${location.hostname}:3000`;
        const apiBase = window.GOCDESK_API_BASE_URL || defaultBase;
        return new URL(`/api/${path}`, apiBase);
    }

    function renderNavigation(role) {
        const sidebar = area.querySelector('.admin-sidebar-bottom');
        if (!sidebar) return;

        sidebar.querySelector('.admin-role').textContent = role.label;
        if (role.sections.length < 2) return;

        const navigation = document.createElement('nav');
        navigation.className = 'admin-section-nav';
        navigation.setAttribute('aria-label', 'Khu vực quản trị');
        for (const key of role.sections) {
            const { url, label } = sections.get(key);
            const link = document.createElement('a');
            link.href = url;
            link.textContent = label;
            if (key === section) link.setAttribute('aria-current', 'page');
            navigation.append(link);
        }
        sidebar.querySelector('.admin-role').after(navigation);
    }

    async function openSection() {
        const status = document.getElementById('admin-auth-status');
        const message = status.querySelector('[role="status"]');
        const retry = status.querySelector('button');
        retry.addEventListener('click', () => location.reload());

        let user;
        try {
            const response = await fetch(getApiEndpoint('auth/me'), { credentials: 'include', cache: 'no-store' });
            if (response.status === 401) {
                location.replace(loginUrl);
                return null;
            }
            if (!response.ok) throw new Error('Không thể kiểm tra phiên.');
            user = (await response.json()).data?.user;
        } catch {
            message.textContent = 'Không thể kiểm tra phiên quản trị. Hãy kiểm tra backend rồi thử lại.';
            retry.hidden = false;
            return null;
        }

        const role = roles.get(user?.role);
        if (!role?.sections.includes(section)) {
            location.replace(homeFor(user?.role) || loginUrl);
            return null;
        }

        const logout = document.getElementById('admin-logout');
        logout.addEventListener('click', async () => {
            if (logout.disabled) return;
            logout.disabled = true;
            const previousRole = currentRole;
            currentRole = undefined;
            try {
                const response = await fetch(getApiEndpoint('auth/logout'), { method: 'POST', credentials: 'include' });
                if (!response.ok) throw new Error('Không thể đăng xuất.');
                area.hidden = true;
                location.replace(loginUrl);
            } catch {
                currentRole = previousRole;
                logout.disabled = false;
                status.hidden = false;
                message.textContent = 'Chưa thể đăng xuất. Vui lòng thử lại.';
            }
        });

        renderNavigation(role);
        currentRole = user.role;
        status.hidden = true;
        area.hidden = false;
        return user;
    }

    if (area) {
        window.addEventListener('pageshow', (event) => {
            if (!event.persisted) return;
            currentRole = undefined;
            area.hidden = true;
            location.reload();
        });
    }

    window.GDAdminAuth = Object.freeze({
        getApiEndpoint,
        homeFor,
        canManage,
        ready: area ? openSection() : Promise.resolve(null),
    });
})();
