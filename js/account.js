
/* ==========================================================
   GÓC DESK — ACCOUNT JAVASCRIPT
   FRONTEND PROTOTYPE

   Chức năng:
   1. Chuyển tab đăng nhập / đăng ký / quên mật khẩu.
   2. Hiện và ẩn mật khẩu.
   3. Kiểm tra dữ liệu nhập vào.
   4. Chuyển đổi 6 mục trong Dashboard.
   5. Xem trước giao diện tài khoản.
   6. Hiển thị thông báo cho người dùng.

   Lưu ý:
   Đây là JavaScript Frontend, chưa kết nối Backend/API.
   ========================================================== */

(function () {
    'use strict';


    // ======================================================
    // 1. LẤY CÁC THÀNH PHẦN HTML
    // ======================================================

    const authLayout = document.getElementById('account-auth');
    const dashboard = document.getElementById('account-dashboard');

    // Dừng script nếu không tìm thấy các thành phần Account.
    if (!authLayout || !dashboard) return;

    // Các nút chuyển tab đăng nhập / đăng ký / quên mật khẩu.
    const authTabs = document.querySelectorAll('[data-auth-tab]');

    // Các khu vực form tương ứng.
    const authPanels = document.querySelectorAll('[data-auth-panel]');

    // Các nút điều hướng trong Dashboard.
    const dashboardTabs = document.querySelectorAll('[data-account-view]');

    // Các khu vực nội dung trong Dashboard.
    const dashboardPanels = document.querySelectorAll('[data-account-panel]');
    let memberAuthenticated = false;


    // ======================================================
    // 2. HÀM HIỂN THỊ THÔNG BÁO
    // ======================================================

    function setStatus(element, message, type = '') {

        if (!element) return;

        element.textContent = message;

        element.classList.toggle('is-error', type === 'error');
        element.classList.toggle('is-success', type === 'success');
    }

    function getAuthEndpoint(endpoint) {
        const apiBase = window.GOCDESK_API_BASE_URL
            || `${window.location.protocol}//${window.location.hostname}:3000`;
        return new URL(`/api/auth/${endpoint}`, apiBase);
    }

    function parseVietnamPhoneInput(value) {
        const compact = value.trim().replace(/[\s().-]/g, '');
        let nationalNumber;

        if (/^0[0-9]*$/.test(compact)) nationalNumber = compact.slice(1);
        else if (/^\+?84[0-9]*$/.test(compact)) nationalNumber = compact.replace(/^\+?84/, '');
        else if (/^[0-9]*$/.test(compact)) nationalNumber = compact;
        else return { error: 'Số điện thoại chỉ được chứa chữ số và mã +84 hợp lệ.' };

        if (nationalNumber.length < 9) return { error: 'Vui lòng nhập đủ 9 chữ số.' };
        if (nationalNumber.length > 9) return { error: 'Số điện thoại chỉ được gồm 9 chữ số sau mã +84.' };
        if (!/^[35789][0-9]{8}$/.test(nationalNumber)) {
            return { error: 'Định dạng số di động Việt Nam không hợp lệ.' };
        }

        return { nationalNumber, phone: `+84${nationalNumber}` };
    }

    const registerPhoneInput = document.getElementById('register-phone');
    const registerPhoneError = document.getElementById('register-phone-error');

    function validateRegisterPhone(showError = true) {
        if (!registerPhoneInput) return null;
        const parsed = parseVietnamPhoneInput(registerPhoneInput.value);
        const error = parsed.error || '';
        registerPhoneInput.setCustomValidity(error);
        registerPhoneInput.setAttribute('aria-invalid', String(Boolean(error)));
        registerPhoneInput.closest('.register-phone-control')?.classList.toggle('is-invalid', Boolean(error));
        if (registerPhoneError) {
            registerPhoneError.textContent = error;
            registerPhoneError.hidden = !showError || !error;
        }
        return error ? null : parsed;
    }

    if (registerPhoneInput) {
        registerPhoneInput.addEventListener('input', () => {
            const parsed = validateRegisterPhone();
            if (parsed) registerPhoneInput.value = parsed.nationalNumber;
        });
        registerPhoneInput.addEventListener('paste', (event) => {
            const pasted = event.clipboardData?.getData('text') || '';
            const parsed = parseVietnamPhoneInput(pasted);
            event.preventDefault();
            if (!parsed.error) registerPhoneInput.value = parsed.nationalNumber;
            else registerPhoneInput.value = pasted.slice(0, registerPhoneInput.maxLength);
            validateRegisterPhone();
        });
        registerPhoneInput.addEventListener('blur', () => validateRegisterPhone());
    }


    // ======================================================
    // 3. CHUYỂN TAB ĐĂNG NHẬP / ĐĂNG KÝ / QUÊN MẬT KHẨU
    // ======================================================

    function showAuthPanel(name) {

        // Ẩn tất cả form, chỉ hiện form được chọn.
        authPanels.forEach((panel) => {
            panel.hidden = panel.dataset.authPanel !== name;
        });

        // Cập nhật trạng thái các nút tab.
        authTabs.forEach((tab) => {

            const active = tab.dataset.authTab === name;

            tab.classList.toggle('is-active', active);

            if (tab.hasAttribute('role')) {
                tab.setAttribute('aria-selected', String(active));
                tab.setAttribute('tabindex', active ? '0' : '-1');
            }
        });
    }

    // ======================================================
    // 4. CHUYỂN CÁC MỤC TRONG DASHBOARD
    // ======================================================

    function showDashboardView(name) {

        // Hiển thị đúng nội dung tương ứng.
        dashboardPanels.forEach((panel) => {
            panel.hidden = panel.dataset.accountPanel !== name;
        });

        // Cập nhật trạng thái nút Sidebar.
        dashboardTabs.forEach((tab) => {

            const active = tab.dataset.accountView === name;

            tab.classList.toggle('is-active', active);

            if (active) {
                tab.setAttribute('aria-current', 'page');
            } else {
                tab.removeAttribute('aria-current');
            }
        });
    }


    // ======================================================
    // 5. GẮN SỰ KIỆN CHO CÁC TAB AUTH
    // ======================================================

    authTabs.forEach((tab) => {

        tab.addEventListener('click', () => {

            const target = tab.dataset.authTab;

            // Xóa thông báo cũ khi người dùng chuyển form.
            const statusId = {
                login: 'login-status',
                register: 'register-status',
                forgot: 'forgot-status',
                admin: 'admin-login-status'
            };

            if (statusId[target]) {
                setStatus(
                    document.getElementById(statusId[target]),
                    ''
                );
            }

            // Chuyển sang form được chọn.
            showAuthPanel(target);
        });
    });


    // ======================================================
    // 6. CHỨC NĂNG HIỆN / ẨN MẬT KHẨU
    // ======================================================

    document.querySelectorAll('[data-toggle-password]').forEach((button) => {

        button.addEventListener('click', () => {

            const input = document.getElementById(
                button.dataset.togglePassword
            );

            if (!input) return;

            // Kiểm tra trạng thái hiện tại.
            const reveal = input.type === 'password';

            // Đổi kiểu input để hiện hoặc ẩn mật khẩu.
            input.type = reveal ? 'text' : 'password';

            // Cập nhật trạng thái nút.
            button.setAttribute('aria-pressed', String(reveal));

            button.setAttribute(
                'aria-label',
                reveal ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
            );
        });
    });


    // ======================================================
    // 7. XỬ LÝ FORM ĐĂNG NHẬP
    // ======================================================

    document.getElementById('login-form')?.addEventListener(
        'submit',
        async (event) => {

            // Ngăn form tải lại trang.
            event.preventDefault();

            const form = event.currentTarget;

            // Kiểm tra các trường bắt buộc.
            if (!form.reportValidity()) return;

            const status = document.getElementById('login-status');
            const submitButton = form.querySelector('[type="submit"]');
            const identity = form.elements.identity.value.trim();
            const passwordInput = form.elements.password;
            const password = passwordInput.value;
            const rememberMe = document.getElementById('remember-login').checked;
            if (submitButton) submitButton.disabled = true;
            setStatus(status, 'Đang đăng nhập…');

            try {
                const response = await fetch(getAuthEndpoint('login'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identity, password, rememberMe }),
                });
                const payload = await readApiPayload(response);
                if (!response.ok) throw new Error(payload.message || 'Thông tin đăng nhập không hợp lệ.');

                const user = await loadCurrentMember();
                if (!user) throw new Error('Đăng nhập thành công nhưng trình duyệt chưa nhận được phiên. Hãy kiểm tra kết nối và thử lại.');
                showMemberDashboard(user, `Xin chào ${user.fullName || 'thành viên'}. Bạn đang đăng nhập.`, true);
            } catch (error) {
                setStatus(status, error.message || 'Không thể kết nối máy chủ xác thực. Vui lòng thử lại.', 'error');
            } finally {
                passwordInput.value = '';
                if (submitButton) submitButton.disabled = false;
            }
        }
    );


    // ======================================================
    // 8. XỬ LÝ FORM ĐĂNG KÝ
    // ======================================================

    document.getElementById('register-form')?.addEventListener(
        'submit',
        async (event) => {

            event.preventDefault();

            const form = event.currentTarget;

            const phone = validateRegisterPhone();
            if (!phone) {
                registerPhoneInput?.reportValidity();
                return;
            }

            // Kiểm tra dữ liệu bắt buộc.
            if (!form.reportValidity()) return;

            // Lấy mật khẩu và xác nhận mật khẩu.
            const password = document.getElementById(
                'register-password'
            ).value;

            const confirmation = document.getElementById(
                'register-confirm'
            ).value;

            // Kiểm tra hai mật khẩu có trùng nhau không.
            if (password !== confirmation) {

                setStatus(
                    document.getElementById('register-status'),
                    'Mật khẩu xác nhận chưa khớp. Vui lòng kiểm tra lại.',
                    'error'
                );

                document.getElementById('register-confirm').focus();

                return;
            }

            const status = document.getElementById('register-status');
            const submitButton = form.querySelector('[type="submit"]');
            if (submitButton) submitButton.disabled = true;
            setStatus(status, 'Đang gửi yêu cầu đăng ký…');

            try {
                const response = await fetch(getAuthEndpoint('register'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: document.getElementById('register-name').value.trim(),
                        email: document.getElementById('register-email').value.trim(),
                        phone: phone.phone,
                        password,
                    }),
                });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.message || 'Chưa thể đăng ký. Vui lòng kiểm tra thông tin và thử lại.');
                setStatus(status, payload.message || 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.', 'success');
                form.reset();
                registerPhoneInput.setCustomValidity('');
                registerPhoneInput.removeAttribute('aria-invalid');
                registerPhoneInput.closest('.register-phone-control')?.classList.remove('is-invalid');
                if (registerPhoneError) {
                    registerPhoneError.textContent = '';
                    registerPhoneError.hidden = true;
                }
            } catch (error) {
                setStatus(status, error.message || 'Không thể kết nối dịch vụ đăng ký. Vui lòng thử lại sau.', 'error');
            } finally {
                if (submitButton) submitButton.disabled = false;
            }
        }
    );


    // ======================================================
    // 9. XỬ LÝ FORM QUÊN MẬT KHẨU
    // ======================================================

    document.getElementById('forgot-form')?.addEventListener(
        'submit',
        (event) => {

            event.preventDefault();

            const form = event.currentTarget;

            if (!form.reportValidity()) return;

            setStatus(
                document.getElementById('forgot-status'),
                'Yêu cầu chưa được gửi. Chức năng khôi phục mật khẩu cần dịch vụ Backend và email.'
            );
        }
    );


    // ======================================================
    // 10. MỞ DASHBOARD ĐỂ XEM TRƯỚC
    // ======================================================

    function openDashboardPreview() {

        // Ẩn khu vực đăng nhập / đăng ký.
        authLayout.hidden = true;

        // Hiển thị Dashboard.
        dashboard.hidden = false;
        memberAuthenticated = false;
        const previewLabel = dashboard.querySelector('.preview-label');
        if (previewLabel) previewLabel.hidden = false;
        const exitButton = document.getElementById('exit-preview');
        if (exitButton) exitButton.textContent = '← Thoát bản xem trước';

        // Mặc định mở mục Thông tin cá nhân.
        showDashboardView('profile');

        // Cuộn đến Dashboard.
        dashboard.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    async function readApiPayload(response) {
        return response.json().catch(() => ({}));
    }

    async function loadCurrentMember() {
        const response = await fetch(getAuthEndpoint('me'), { credentials: 'include' });
        const payload = await readApiPayload(response);
        if (response.status === 401) return null;
        if (!response.ok) throw new Error(payload.message || 'Không thể kiểm tra phiên đăng nhập.');
        return payload.data?.user || null;
    }

    function showMemberDashboard(user, message, scrollIntoView = false) {
        if (!user) return;
        memberAuthenticated = true;
        authLayout.hidden = true;
        dashboard.hidden = false;
        showDashboardView('profile');

        const fullName = user.fullName || user.full_name || 'Thành viên Góc Desk';
        const userCard = dashboard.querySelector('.dashboard-user-card');
        if (userCard) {
            const name = userCard.querySelector('strong');
            const state = userCard.querySelector('span:not(.dashboard-avatar)');
            if (name) name.textContent = fullName;
            if (state) state.textContent = user.accountStatus === 'active' ? 'Đã đăng nhập · Đã xác minh' : 'Đã đăng nhập';
        }

        const profileValues = {
            'profile-name': fullName,
            'profile-email': user.email || '',
            'profile-phone': user.phone || '',
        };
        for (const [id, value] of Object.entries(profileValues)) {
            const input = document.getElementById(id);
            if (input) input.value = value;
        }

        const previewLabel = dashboard.querySelector('.preview-label');
        if (previewLabel) previewLabel.hidden = true;
        const exitButton = document.getElementById('exit-preview');
        if (exitButton) exitButton.textContent = 'Đăng xuất';
        setStatus(document.getElementById('profile-status'), message || `Xin chào ${fullName}. Bạn đang đăng nhập.`, 'success');
        if (scrollIntoView) dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function verifyEmailFromLink() {
        const pageUrl = new URL(window.location.href);
        const token = pageUrl.searchParams.get('token');
        if (!token) return false;

        showAuthPanel('login');
        const status = document.getElementById('login-status');
        setStatus(status, 'Đang xác minh email…');

        try {
            const response = await fetch(getAuthEndpoint('verify-email'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            if (response.ok || response.status < 500) {
                pageUrl.searchParams.delete('token');
                window.history.replaceState(null, '', `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`);
            }

            const payload = await readApiPayload(response);
            if (!response.ok) throw new Error(payload.message || 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.');

            const user = await loadCurrentMember();
            if (!user) throw new Error('Email đã được xác minh, nhưng chưa thể khôi phục phiên đăng nhập. Hãy đăng nhập lại.');
            showMemberDashboard(user, 'Email đã xác minh. Tài khoản đã kích hoạt và bạn đang đăng nhập.', true);
        } catch (error) {
            setStatus(status, error.message || 'Không thể kết nối máy chủ để xác minh email. Hãy thử lại khi kết nối ổn định.', 'error');
        }
        return true;
    }

    async function initializeMemberSession() {
        if (new URL(window.location.href).searchParams.has('token')) {
            await verifyEmailFromLink();
            return;
        }

        try {
            const user = await loadCurrentMember();
            if (user) showMemberDashboard(user, `Xin chào ${user.fullName || 'thành viên'}. Phiên đăng nhập đã được khôi phục.`);
        } catch (error) {
            setStatus(document.getElementById('login-status'), error.message || 'Không thể kiểm tra phiên đăng nhập.', 'error');
        }
    }


    // Gắn sự kiện cho nút xem trước Dashboard.
    document.getElementById('preview-dashboard')?.addEventListener(
        'click',
        openDashboardPreview
    );


    // ======================================================
    // 11. CHUYỂN MỤC SIDEBAR TRONG DASHBOARD
    // ======================================================

    dashboardTabs.forEach((tab) => {

        tab.addEventListener('click', () => {

            const target = tab.dataset.accountView;

            // Hiển thị nội dung tương ứng.
            showDashboardView(target);
        });
    });


    // ======================================================
    // 12. THOÁT KHỎI DASHBOARD XEM TRƯỚC
    // ======================================================

    document.getElementById('exit-preview')?.addEventListener(
        'click',
        async () => {

            if (memberAuthenticated) {
                const button = document.getElementById('exit-preview');
                if (button) button.disabled = true;
                try {
                    const response = await fetch(getAuthEndpoint('logout'), {
                        method: 'POST',
                        credentials: 'include',
                    });
                    const payload = await readApiPayload(response);
                    if (!response.ok) throw new Error(payload.message || 'Không thể đăng xuất. Vui lòng thử lại.');
                    if (await loadCurrentMember()) throw new Error('Phiên vẫn còn hiệu lực. Vui lòng thử đăng xuất lại.');

                    memberAuthenticated = false;
                    dashboard.hidden = true;
                    authLayout.hidden = false;
                    showAuthPanel('login');
                    setStatus(document.getElementById('login-status'), payload.message || 'Đăng xuất thành công.', 'success');
                    authLayout.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } catch (error) {
                    setStatus(document.getElementById('profile-status'), error.message || 'Không thể kết nối máy chủ để đăng xuất.', 'error');
                } finally {
                    if (button) button.disabled = false;
                }
                return;
            }

            // Ẩn Dashboard.
            dashboard.hidden = true;

            // Hiển thị lại khu vực đăng nhập.
            authLayout.hidden = false;

            // Quay về tab đăng nhập.
            showAuthPanel('login');

            // Cuộn về khu vực form.
            authLayout.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    );


    // ======================================================
    // 13. XỬ LÝ FORM THÔNG TIN CÁ NHÂN (BẢN DEMO)
    // ======================================================

    document.getElementById('profile-form')?.addEventListener(
        'submit',
        (event) => {

            event.preventDefault();

            setStatus(
                document.getElementById('profile-status'),
                memberAuthenticated
                    ? 'Chức năng cập nhật hồ sơ chưa được kết nối API.'
                    : 'Đây là bản xem trước; thông tin chưa được lưu vào tài khoản.'
            );
        }
    );


    // ======================================================
    // 14. XỬ LÝ FORM ĐỊA CHỈ (BẢN DEMO)
    // ======================================================

    document.getElementById('address-form')?.addEventListener(
        'submit',
        (event) => {

            event.preventDefault();

            setStatus(
                document.getElementById('address-status'),
                'Đây là bản xem trước; địa chỉ chưa được lưu vào tài khoản.'
            );
        }
    );


    if (window.location.hash === '#admin') showAuthPanel('admin');
    initializeMemberSession();
})();
