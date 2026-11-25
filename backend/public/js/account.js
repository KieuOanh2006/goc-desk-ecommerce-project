
/* ==========================================================
   GÓC DESK — ACCOUNT JAVASCRIPT
   MEMBER AUTHENTICATION

   Chức năng:
   1. Chuyển tab đăng nhập / đăng ký / quên mật khẩu.
   2. Hiện và ẩn mật khẩu.
   3. Kiểm tra dữ liệu nhập vào.
   4. Chuyển đổi 6 mục trong Dashboard.
   5. Xem trước giao diện tài khoản.
   6. Hiển thị thông báo cho người dùng.

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
    let sessionCheckInProgress = false;
    let authStateRevision = 0;


    // ======================================================
    // 2. HÀM HIỂN THỊ THÔNG BÁO
    // ======================================================

    function setStatus(element, message, type = '') {

        if (!element) return;

        element.textContent = message;

        element.classList.toggle('is-error', type === 'error');
        element.classList.toggle('is-success', type === 'success');
    }

    function setButtonLoading(button, loading, label) {
        if (!button) return;
        button.disabled = loading;
        button.setAttribute('aria-busy', String(loading));
        const labelElement = button.querySelector('.account-submit-label');
        if (labelElement && label) labelElement.textContent = loading ? 'Đang xử lý…' : label;
    }

    function showGuest(message = '', type = '') {
        memberAuthenticated = false;
        dashboard.hidden = true;
        authLayout.hidden = false;
        const sessionStatus = document.getElementById('session-status');
        setStatus(sessionStatus, message, type);
        if (sessionStatus) sessionStatus.hidden = !message;
        const retryButton = document.getElementById('retry-session-check');
        if (retryButton) retryButton.hidden = !message;
    }

    function getAuthEndpoint(endpoint) {
        return getApiEndpoint(`auth/${endpoint}`);
    }

    function getApiEndpoint(path) {
        const defaultBase = window.location.protocol === 'https:'
            ? window.location.origin
            : `http://${window.location.hostname}:3000`;
        const apiBase = window.GOCDESK_API_BASE_URL || defaultBase;
        return new URL(`/api/${path}`, apiBase);
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

    function getSpecialLinkPanel() {
        let panel = document.getElementById('auth-special-link-panel');
        if (panel) return panel;
        panel = document.createElement('section');
        panel.id = 'auth-special-link-panel';
        panel.className = 'auth-panel';
        panel.hidden = true;
        const title = document.createElement('h2');
        const form = document.createElement('form'); form.className = 'account-form'; form.noValidate = true;
        const password = document.createElement('input'); password.type = 'password'; password.name = 'password'; password.autocomplete = 'new-password'; password.minLength = 8; password.maxLength = 128; password.required = true; password.placeholder = 'Mật khẩu mới';
        const confirm = document.createElement('input'); confirm.type = 'password'; confirm.name = 'confirm'; confirm.autocomplete = 'new-password'; confirm.required = true; confirm.placeholder = 'Nhập lại mật khẩu';
        const submit = document.createElement('button'); submit.type = 'submit'; submit.className = 'account-submit'; submit.textContent = 'Xác nhận';
        const status = document.createElement('p'); status.className = 'form-status'; status.setAttribute('role', 'status');
        form.append(password, confirm, submit, status); panel.append(title, form);
        authLayout.querySelector('.account-auth-card')?.append(panel);
        panel._fields = { title, form, password, confirm, submit, status };
        return panel;
    }

    async function handleInvitationOrPasswordReset() {
        const pageUrl = new URL(window.location.href);
        const invitation = pageUrl.searchParams.get('invitation');
        const resetToken = pageUrl.searchParams.get('resetPassword');
        if (!invitation && !resetToken) return false;
        const token = invitation || resetToken;
        const panel = getSpecialLinkPanel();
        panel.hidden = false;
        authPanels.forEach((item) => { item.hidden = true; });
        const { title, form, password, confirm, status } = panel._fields;
        title.textContent = invitation ? 'Xác nhận lời mời nhân viên' : 'Đặt lại mật khẩu';
        password.value = ''; confirm.value = '';
        form.onsubmit = async (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            if (password.value !== confirm.value) { setStatus(status, 'Mật khẩu xác nhận chưa khớp.', 'error'); return; }
            const endpoint = invitation ? 'accept-invitation' : 'reset-password';
            setButtonLoading(form.querySelector('button[type="submit"]'), true, 'Xác nhận');
            try {
                const body = invitation ? { token, password: password.value } : { token, newPassword: password.value };
                const response = await fetch(getAuthEndpoint(endpoint), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                const payload = await readApiPayload(response);
                if (!response.ok) throw new Error(payload.message || 'Liên kết không hợp lệ hoặc đã hết hạn.');
                pageUrl.searchParams.delete(invitation ? 'invitation' : 'resetPassword'); window.history.replaceState(null, '', `${pageUrl.pathname}${pageUrl.search}${pageUrl.hash}`);
                form.reset(); panel.hidden = true;
                showAuthPanel('login');
                setStatus(document.getElementById('login-status'), invitation ? 'Đã xác nhận lời mời. Hãy đăng nhập.' : 'Mật khẩu đã được đặt lại. Hãy đăng nhập.', 'success');
                if (invitation) showAuthPanel('login');
            } catch (error) { setStatus(status, error.message || 'Không thể xử lý liên kết.', 'error'); }
            finally { setButtonLoading(form.querySelector('button[type="submit"]'), false, 'Xác nhận'); password.value = ''; confirm.value = ''; }
        };
        return true;
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
            authStateRevision += 1;
            setButtonLoading(submitButton, true, 'Đăng nhập');
            setStatus(status, 'Đang đăng nhập…');

            try {
                const response = await fetch(getAuthEndpoint('login'), {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ identity, password, rememberMe }),
                });
                const payload = await readApiPayload(response);
                if (!response.ok) {
                    const message = payload.message || 'Không thể đăng nhập.';
                    if (response.status === 401) {
                        throw new Error(`${message} Kiểm tra email hoặc số điện thoại, mật khẩu và việc xác minh email; tài khoản bị khóa cũng không thể đăng nhập.`);
                    }
                    if (response.status === 403) throw new Error(`${message} Tài khoản có thể đang bị khóa hoặc không được phép đăng nhập.`);
                    throw new Error(message);
                }

                const user = await loadCurrentMember();
                if (!user) throw new Error('Đăng nhập thành công nhưng trình duyệt chưa nhận được phiên. Hãy kiểm tra kết nối và thử lại.');
                const adminHome = window.GDAdminAuth.homeFor(user.role);
                if (adminHome) {
                    window.location.assign(adminHome);
                    return;
                }
                showMemberDashboard(user, `Xin chào ${user.fullName || 'thành viên'}. Bạn đang đăng nhập.`, true);
            } catch (error) {
                setStatus(status, error.message || 'Không thể kết nối máy chủ xác thực. Vui lòng thử lại.', 'error');
            } finally {
                passwordInput.value = '';
                setButtonLoading(submitButton, false, 'Đăng nhập');
            }
        }
    );

    document.getElementById('admin-login-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const status = document.getElementById('admin-login-status');
        const button = form.querySelector('[type="submit"]');
        const passwordInput = form.elements.password;
        authStateRevision += 1;
        setButtonLoading(button, true, 'Đăng nhập quản trị');
        setStatus(status, 'Đang xác thực tài khoản quản trị…');
        try {
            const response = await fetch(getAuthEndpoint('login'), {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identity: form.elements.identity.value.trim(), password: passwordInput.value, rememberMe: false }),
            });
            const payload = await readApiPayload(response);
            if (!response.ok) throw new Error(payload.message || 'Không thể đăng nhập quản trị.');
            const user = await loadCurrentMember();
            if (!user) throw new Error('Backend chưa xác nhận được phiên đăng nhập.');
            const adminHome = window.GDAdminAuth.homeFor(user.role);
            if (!adminHome) {
                await fetch(getAuthEndpoint('logout'), { method: 'POST', credentials: 'include' });
                throw new Error('Tài khoản này không có quyền quản trị.');
            }
            window.location.assign(adminHome);
        } catch (error) {
            setStatus(status, error.message || 'Không thể kết nối Backend Auth.', 'error');
        } finally {
            passwordInput.value = '';
            setButtonLoading(button, false, 'Đăng nhập quản trị');
        }
    });


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
            setButtonLoading(submitButton, true, 'Tạo tài khoản');
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
                const resendForm = document.getElementById('resend-verification-form');
                const resendEmail = document.getElementById('resend-verification-email');
                if (resendEmail) resendEmail.value = document.getElementById('register-email').value.trim();
                if (resendForm) resendForm.hidden = false;
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
                setButtonLoading(submitButton, false, 'Tạo tài khoản');
            }
        }
    );

    document.getElementById('resend-verification-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const button = form.querySelector('[type="submit"]');
        setButtonLoading(button, true, 'Gửi lại email');
        setStatus(document.getElementById('resend-verification-status'), 'Đang gửi yêu cầu…');
        try {
            const response = await fetch(getAuthEndpoint('verify-email/resend'), {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.elements.email.value.trim() }),
            });
            const payload = await readApiPayload(response);
            if (!response.ok) throw new Error(payload.message || 'Chưa thể gửi yêu cầu. Vui lòng thử lại sau.');
            setStatus(document.getElementById('resend-verification-status'), payload.message || 'Nếu tài khoản đủ điều kiện, hướng dẫn xác minh đã được gửi.', 'success');
        } catch (error) {
            setStatus(document.getElementById('resend-verification-status'), error.message || 'Không thể kết nối dịch vụ email.', 'error');
        } finally {
            setButtonLoading(button, false, 'Gửi lại email');
        }
    });


    // ======================================================
    // 9. XỬ LÝ FORM QUÊN MẬT KHẨU
    // ======================================================

    document.getElementById('forgot-form')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const button = form.querySelector('[type="submit"]');
        setButtonLoading(button, true, 'Gửi yêu cầu khôi phục');
        try {
            const response = await fetch(getAuthEndpoint('forgot-password'), {
                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.elements.email.value.trim() }),
            });
            const payload = await readApiPayload(response);
            if (!response.ok) throw new Error(payload.message || 'Chưa thể gửi yêu cầu.');
            setStatus(document.getElementById('forgot-status'), payload.message || 'Nếu email hợp lệ, hướng dẫn sẽ được gửi.', 'success');
        } catch (error) { setStatus(document.getElementById('forgot-status'), error.message || 'Không thể kết nối máy chủ.', 'error'); }
        finally { setButtonLoading(button, false, 'Gửi yêu cầu khôi phục'); }
    });


    async function readApiPayload(response) {
        return response.json().catch(() => ({}));
    }

    async function loadCurrentMember() {
        const response = await fetch(getAuthEndpoint('me'), { credentials: 'include' });
        const payload = await readApiPayload(response);
        if (response.status === 401) return null;
        if (!response.ok) {
            const error = new Error(payload.message || 'Không thể kiểm tra phiên đăng nhập.');
            error.status = response.status;
            throw error;
        }
        const user = payload.data?.user;
        if (!user) throw new Error('Máy chủ chưa trả về thông tin tài khoản hợp lệ.');
        return user;
    }

    function showMemberDashboard(user, message, scrollIntoView = false, preserveDashboardView = false) {
        if (!user) return;
        memberAuthenticated = true;
        authLayout.hidden = true;
        dashboard.hidden = false;
        if (!preserveDashboardView) showDashboardView('profile');

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

        const logoutButton = document.getElementById('logout-member');
        if (logoutButton) logoutButton.textContent = 'Đăng xuất';
        const sessionStatus = document.getElementById('session-status');
        if (sessionStatus) sessionStatus.hidden = true;
        const retryButton = document.getElementById('retry-session-check');
        if (retryButton) retryButton.hidden = true;
        setStatus(document.getElementById('profile-status'), message || `Xin chào ${fullName}. Bạn đang đăng nhập.`, 'success');
        initializeMemberTools();
        loadAddresses().catch((error) => setStatus(document.getElementById('address-status'), error.message, 'error'));
        loadLoyalty();
        if (scrollIntoView) dashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function initializeMemberTools() {
        const profile = document.querySelector('[data-account-panel="profile"]');
        if (!profile || document.getElementById('member-security-tools')) return;
        const tools = document.createElement('section'); tools.id = 'member-security-tools';
        const heading = document.createElement('h4'); heading.textContent = 'Bảo mật tài khoản'; tools.append(heading);
        const form = document.createElement('form'); form.className = 'dashboard-form'; form.innerHTML = '<label>Mật khẩu hiện tại<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>Mật khẩu mới<input name="newPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><label>Xác nhận mật khẩu mới<input name="confirmPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><button type="submit" class="account-submit account-submit-small">Đổi mật khẩu</button><p class="form-status" role="status" aria-live="polite"></p>';
        form.addEventListener('submit', async (event) => {
            event.preventDefault(); if (!form.reportValidity()) return;
            if (form.elements.newPassword.value !== form.elements.confirmPassword.value) { setStatus(form.querySelector('.form-status'), 'Mật khẩu xác nhận chưa khớp.', 'error'); return; }
            const button = form.querySelector('button');
            try {
                const response = await fetch(getAuthEndpoint('password'), { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: form.elements.currentPassword.value, newPassword: form.elements.newPassword.value }) });
                const payload = await readApiPayload(response); if (!response.ok) throw new Error(payload.message || 'Không thể cập nhật mật khẩu.');
                form.reset(); showGuest(payload.message || 'Mật khẩu đã đổi. Hãy đăng nhập lại.', 'success'); showAuthPanel('login');
            } catch (error) { setStatus(form.querySelector('.form-status'), error.message, 'error'); }
            finally { form.elements.currentPassword.value = ''; form.elements.newPassword.value = ''; form.elements.confirmPassword.value = ''; if (button) button.disabled = false; }
        });
        tools.append(form);
        const sessionTitle = document.createElement('h4'); sessionTitle.textContent = 'Phiên đăng nhập'; tools.append(sessionTitle);
        const logoutOthers = document.createElement('button'); logoutOthers.type = 'button'; logoutOthers.textContent = 'Đăng xuất thiết bị khác'; tools.append(logoutOthers);
        const list = document.createElement('div'); list.id = 'member-session-list'; tools.append(list);
        logoutOthers.addEventListener('click', async () => {
            try { const response = await fetch(getAuthEndpoint('sessions/logout-others'), { method: 'POST', credentials: 'include' }); const payload = await readApiPayload(response); if (!response.ok) throw new Error(payload.message || 'Không thể thu hồi phiên.'); await loadSessions(); }
            catch (error) { setStatus(document.getElementById('profile-status'), error.message, 'error'); }
        });
        profile.append(tools); loadSessions();
    }

    async function loadSessions() {
        const root = document.getElementById('member-session-list'); if (!root) return;
        try {
            const response = await fetch(getAuthEndpoint('sessions'), { credentials: 'include' }); const payload = await readApiPayload(response);
            if (!response.ok) throw new Error(payload.message || 'Không thể tải phiên đăng nhập.');
            root.replaceChildren();
            for (const session of payload.data.sessions || []) {
                const item = document.createElement('p'); item.textContent = `${session.browser} · ${session.operatingSystem}${session.isCurrent ? ' · Thiết bị này' : ''}`;
                if (!session.isCurrent) { const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Thu hồi'; button.addEventListener('click', async () => { try { const result = await fetch(getAuthEndpoint(`sessions/${encodeURIComponent(session.sessionId)}`), { method: 'DELETE', credentials: 'include' }); const body = await readApiPayload(result); if (!result.ok) throw new Error(body.message || 'Không thể thu hồi phiên.'); await loadSessions(); } catch (error) { setStatus(document.getElementById('profile-status'), error.message, 'error'); } }); item.append(button); }
                root.append(item);
            }
        } catch (error) { root.textContent = error.message; }
    }

    async function verifyEmailFromLink() {
        const pageUrl = new URL(window.location.href);
        const token = pageUrl.searchParams.get('token');
        if (!token) return false;

        showAuthPanel('login');
        const status = document.getElementById('login-status');
        setStatus(status, 'Đang xác minh email…');
        authStateRevision += 1;

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
            if (!response.ok) {
                const error = new Error(payload.message || 'Liên kết xác minh không hợp lệ hoặc đã hết hạn.');
                error.verificationFailed = response.status < 500;
                throw error;
            }

            const user = await loadCurrentMember();
            if (!user) throw new Error('Email đã được xác minh, nhưng chưa thể khôi phục phiên đăng nhập. Hãy đăng nhập lại.');
            showMemberDashboard(user, 'Email đã xác minh. Tài khoản đã kích hoạt và bạn đang đăng nhập.', true);
        } catch (error) {
            if (error.verificationFailed) {
                showAuthPanel('register');
                const resendForm = document.getElementById('resend-verification-form');
                if (resendForm) resendForm.hidden = false;
                setStatus(document.getElementById('register-status'), `${error.message} Nhập email bên dưới để yêu cầu gửi lại hướng dẫn xác minh.`, 'error');
                setStatus(status, '');
            } else {
                setStatus(status, error.message || 'Không thể kết nối máy chủ để xác minh email. Hãy thử lại khi kết nối ổn định.', 'error');
            }
        }
        return true;
    }

    async function initializeMemberSession() {
        if (sessionCheckInProgress) return;
        sessionCheckInProgress = true;
        const revision = authStateRevision;
        if (await handleInvitationOrPasswordReset()) { sessionCheckInProgress = false; return; }
        if (new URL(window.location.href).searchParams.has('token')) {
            try {
                await verifyEmailFromLink();
            } finally {
                sessionCheckInProgress = false;
            }
            return;
        }

        try {
            const user = await loadCurrentMember();
            if (revision !== authStateRevision) return;
            const adminHome = window.GDAdminAuth.homeFor(user?.role);
            if (adminHome) {
                window.location.replace(adminHome);
                return;
            }
            if (user) showMemberDashboard(user, `Xin chào ${user.fullName || 'thành viên'}. Phiên đăng nhập đã được khôi phục.`, false, memberAuthenticated);
            else showGuest();
        } catch (error) {
            if (revision !== authStateRevision) return;
            if (error.status === 401) showGuest();
            else showGuest('Không thể kiểm tra phiên đăng nhập do lỗi kết nối. Hiện chưa xác nhận trạng thái tài khoản; hãy thử lại.', 'error');
        } finally {
            sessionCheckInProgress = false;
        }
    }

    document.getElementById('retry-session-check')?.addEventListener('click', initializeMemberSession);
    window.addEventListener('pageshow', () => {
        if (memberAuthenticated) initializeMemberSession();
    });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && memberAuthenticated) initializeMemberSession();
    });


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
    // 12. ĐĂNG XUẤT MEMBER
    // ======================================================

    document.getElementById('logout-member')?.addEventListener(
        'click',
        async () => {

            if (memberAuthenticated) {
                const button = document.getElementById('logout-member');
                authStateRevision += 1;
                if (button) button.disabled = true;
                try {
                    const response = await fetch(getAuthEndpoint('logout'), {
                        method: 'POST',
                        credentials: 'include',
                    });
                    const payload = await readApiPayload(response);
                    if (!response.ok) throw new Error(payload.message || 'Không thể đăng xuất. Vui lòng thử lại.');

                    showGuest();
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

            showGuest();
            showAuthPanel('login');

            // Cuộn về khu vực form.
            authLayout.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    );


    // ======================================================
    // 13. Hồ sơ, địa chỉ và Loyalty được đọc/ghi qua API có session.
    // ======================================================

    document.getElementById('profile-form')?.addEventListener(
        'submit',
        async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            if (!form.reportValidity()) return;
            const button = form.querySelector('[type="submit"]');
            setButtonLoading(button, true, 'Lưu thay đổi');
            try {
                const response = await fetch(getApiEndpoint('users/me'), { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName: form.elements.name.value.trim(), phone: form.elements.phone.value.trim() }) });
                const payload = await readApiPayload(response);
                if (!response.ok) throw new Error(payload.message || 'Không thể cập nhật hồ sơ.');
                showMemberDashboard(payload.data.user, 'Hồ sơ đã được cập nhật.', false, true);
            } catch (error) { setStatus(document.getElementById('profile-status'), error.message || 'Không thể kết nối máy chủ.', 'error'); }
            finally { setButtonLoading(button, false, 'Lưu thay đổi'); }
        }
    );


    // ======================================================
    // 14. ĐỊA CHỈ CHƯA CÓ API LƯU TRỮ
    // ======================================================

    document.getElementById('address-form')?.addEventListener(
        'submit',
        async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            if (!form.reportValidity()) return;
            const addressId = form.dataset.addressId;
            const address = { recipientName: document.getElementById('address-recipient').value.trim(), phone: document.getElementById('address-phone').value.trim(), addressLine: document.getElementById('address-detail').value.trim(), ward: document.getElementById('address-ward').value.trim() || null, district: document.getElementById('address-district').value.trim(), province: document.getElementById('address-province').value.trim(), isDefault: document.getElementById('address-default').checked };
            const button = form.querySelector('[type="submit"]');
            setButtonLoading(button, true, addressId ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ');
            try {
                const response = await fetch(getApiEndpoint(`users/me/addresses${addressId ? `/${encodeURIComponent(addressId)}` : ''}`), { method: addressId ? 'PATCH' : 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(address) });
                const payload = await readApiPayload(response);
                if (!response.ok) throw new Error(payload.message || 'Không thể lưu địa chỉ.');
                form.reset(); delete form.dataset.addressId;
                document.getElementById('address-cancel-edit').hidden = true;
                setStatus(document.getElementById('address-status'), 'Địa chỉ đã được lưu.', 'success');
                await loadAddresses();
            } catch (error) { setStatus(document.getElementById('address-status'), error.message || 'Không thể kết nối máy chủ.', 'error'); }
            finally { setButtonLoading(button, false, form.dataset.addressId ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'); }
        }
    );

    async function loadAddresses() {
        const response = await fetch(getApiEndpoint('users/me/addresses'), { credentials: 'include' });
        const payload = await readApiPayload(response);
        if (!response.ok) throw new Error(payload.message || 'Không thể tải địa chỉ.');
        const root = document.getElementById('address-list');
        root.replaceChildren();
        for (const item of payload.data?.addresses || []) {
            const card = document.createElement('article');
            const text = document.createElement('p');
            text.textContent = `${item.recipientName} · ${item.phone} · ${item.addressLine}, ${[item.ward, item.district, item.province].filter(Boolean).join(', ')}${item.isDefault ? ' · Mặc định' : ''}`;
            const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Sửa';
            edit.addEventListener('click', () => {
                document.getElementById('address-recipient').value = item.recipientName;
                document.getElementById('address-phone').value = item.phone;
                document.getElementById('address-detail').value = item.addressLine;
                document.getElementById('address-ward').value = item.ward || '';
                document.getElementById('address-district').value = item.district;
                document.getElementById('address-province').value = item.province;
                document.getElementById('address-default').checked = item.isDefault;
                document.getElementById('address-form').dataset.addressId = item.id;
                document.getElementById('address-cancel-edit').hidden = false;
            });
            const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Xóa';
            remove.addEventListener('click', async () => {
                if (!window.confirm('Xóa địa chỉ này?')) return;
                try { const result = await fetch(getApiEndpoint(`users/me/addresses/${encodeURIComponent(item.id)}`), { method: 'DELETE', credentials: 'include' }); const body = await readApiPayload(result); if (!result.ok) throw new Error(body.message || 'Không thể xóa địa chỉ.'); await loadAddresses(); }
                catch (error) { setStatus(document.getElementById('address-status'), error.message, 'error'); }
            });
            card.append(text, edit, remove); root.append(card);
        }
    }

    document.getElementById('address-cancel-edit')?.addEventListener('click', () => {
        const form = document.getElementById('address-form'); form.reset(); delete form.dataset.addressId;
        document.getElementById('address-cancel-edit').hidden = true;
    });

    async function loadLoyalty() {
        try {
            const [overviewResponse, rewardResponse, transactionResponse, redemptionResponse] = await Promise.all([
                fetch(getApiEndpoint('loyalty/me'), { credentials: 'include' }),
                fetch(getApiEndpoint('loyalty/rewards'), { credentials: 'include' }),
                fetch(getApiEndpoint('loyalty/transactions'), { credentials: 'include' }),
                fetch(getApiEndpoint('loyalty/redemptions'), { credentials: 'include' }),
            ]);
            const [overview, rewards, transactions, redemptions] = await Promise.all([readApiPayload(overviewResponse), readApiPayload(rewardResponse), readApiPayload(transactionResponse), readApiPayload(redemptionResponse)]);
            if (!overviewResponse.ok || !rewardResponse.ok || !transactionResponse.ok || !redemptionResponse.ok) throw new Error('Không thể tải thông tin điểm thưởng.');
            document.getElementById('loyalty-balance').textContent = `${overview.data.overview.pointsBalance} điểm`;
            document.getElementById('loyalty-tier').textContent = overview.data.overview.tier?.name || 'Chưa có hạng thành viên được cấu hình';
            const rewardRoot = document.getElementById('loyalty-rewards'); rewardRoot.replaceChildren();
            const rewardsList = rewards.data.rewards || [];
            if (!rewardsList.length) rewardRoot.textContent = 'Hiện chưa có phần thưởng được cấu hình.';
            for (const reward of rewardsList) {
                const row = document.createElement('p'); row.textContent = `${reward.name} · ${reward.pointsCost} điểm `;
                const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Đổi';
                button.addEventListener('click', async () => {
                    try { const response = await fetch(getApiEndpoint('loyalty/redeem'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rewardId: reward.id }) }); const payload = await readApiPayload(response); if (!response.ok) throw new Error(payload.message || 'Không thể đổi thưởng.'); await loadLoyalty(); }
                    catch (error) { setStatus(document.getElementById('profile-status'), error.message, 'error'); }
                }); row.append(button); rewardRoot.append(row);
            }
            const history = document.getElementById('loyalty-history'); history.replaceChildren();
            for (const item of transactions.data.transactions || []) { const row = document.createElement('p'); row.textContent = `${item.type}: ${item.pointsDelta} điểm${item.description ? ` · ${item.description}` : ''}`; history.append(row); }
            if (!(transactions.data.transactions || []).length) history.textContent = 'Chưa có giao dịch điểm.';
            for (const item of redemptions.data.redemptions || []) { const row = document.createElement('p'); row.textContent = `Đổi ${item.rewardName}: ${item.pointsSpent} điểm · ${item.status}`; history.append(row); }
        } catch (error) { document.getElementById('loyalty-balance').textContent = 'Chưa tải được'; document.getElementById('loyalty-tier').textContent = error.message; }
    }

    if (window.location.hash === '#admin') showAuthPanel('admin');
    initializeMemberSession();
})();
