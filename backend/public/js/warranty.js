// Biểu mẫu mô phỏng: không lưu hoặc gửi thông tin khách hàng.
(() => {
    const form = document.getElementById('warranty-form');
    const status = document.getElementById('warranty-status');
    if (!form || !status) return;

    const contact = form.querySelector('#customer-contact');
    const fields = form.querySelectorAll('input[required], textarea[required], select[required]');

    function validateField(field) {
        field.setCustomValidity('');
        const value = field.value.trim();
        if (!value) {
            field.setCustomValidity('Vui lòng điền thông tin bắt buộc.');
        } else if (field === contact) {
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            const phone = value.replace(/[\s().-]/g, '');
            const isPhone = /^(?:0\d{9}|\+84\d{9})$/.test(phone);
            if (!isEmail && !isPhone) {
                field.setCustomValidity('Vui lòng nhập email hợp lệ hoặc số điện thoại Việt Nam gồm 10 chữ số (hoặc đầu +84).');
            }
        }
    }

    fields.forEach((field) => {
        field.addEventListener('input', () => {
            validateField(field);
            status.hidden = true;
            status.textContent = '';
        });
    });

    // Tự kiểm tra khi gửi để bắt cả trường hợp chỉ nhập khoảng trắng.
    form.noValidate = true;
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        fields.forEach(validateField);
        if (!form.reportValidity()) {
            status.textContent = 'Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường được đánh dấu. Yêu cầu chưa được gửi đến cửa hàng.';
            status.hidden = false;
            return;
        }
        status.textContent = 'Đã kiểm tra thông tin — yêu cầu chưa được gửi đến cửa hàng. Đây là biểu mẫu mô phỏng; thông tin không được lưu và cửa hàng chưa tiếp nhận yêu cầu.';
        status.hidden = false;
    });
    form.querySelector('button[type="submit"]').disabled = false;
})();
