
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


    // ======================================================
    // 2. HÀM HIỂN THỊ THÔNG BÁO
    // ======================================================

    function setStatus(element, message, type = '') {

        if (!element) return;

        element.textContent = message;

        element.classList.toggle('is-error', type === 'error');
        element.classList.toggle('is-success', type === 'success');
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
                forgot: 'forgot-status'
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
        (event) => {

            // Ngăn form tải lại trang.
            event.preventDefault();

            const form = event.currentTarget;

            // Kiểm tra các trường bắt buộc.
            if (!form.reportValidity()) return;

            // Chưa có Backend xác thực.
            setStatus(
                document.getElementById('login-status'),
                'Giao diện chưa kết nối API xác thực. Thông tin đăng nhập chưa được gửi hoặc lưu lại.'
            );
        }
    );


    // ======================================================
    // 8. XỬ LÝ FORM ĐĂNG KÝ
    // ======================================================

    document.getElementById('register-form')?.addEventListener(
        'submit',
        (event) => {

            event.preventDefault();

            const form = event.currentTarget;

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

            // Chỉ kiểm tra hợp lệ ở Frontend.
            // Không tạo tài khoản thật.
            setStatus(
                document.getElementById('register-status'),
                'Thông tin đã hợp lệ ở phía trình duyệt. Chưa tạo tài khoản thật vì API đăng ký chưa được kết nối.',
                'success'
            );
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

        // Mặc định mở mục Thông tin cá nhân.
        showDashboardView('profile');

        // Cuộn đến Dashboard.
        dashboard.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
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
        () => {

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
                'Đây là bản xem trước; thông tin chưa được lưu vào tài khoản.'
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


})();
