/* Tra cứu hiện chỉ kiểm tra định dạng; không tạo hoặc suy đoán dữ liệu bảo hành. */
(() => {
  const form = document.getElementById('warranty-lookup-form');
  const serialInput = document.getElementById('warranty-serial');
  const error = document.getElementById('warranty-serial-error');
  const result = document.getElementById('warranty-lookup-result');
  const message = document.getElementById('warranty-result-message');
  if (!form || !serialInput || !error || !result || !message) return;

  const clearFeedback = () => {
    error.hidden = true;
    error.textContent = '';
    serialInput.removeAttribute('aria-invalid');
    result.hidden = true;
    message.textContent = '';
  };

  serialInput.addEventListener('input', clearFeedback);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFeedback();
    const serial = serialInput.value.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{3,63}$/.test(serial)) {
      error.textContent = serial
        ? 'Mã cần có 4–64 ký tự, gồm chữ, số hoặc các dấu - _ . /, không chứa khoảng trắng.'
        : 'Vui lòng nhập mã Serial hoặc IMEI trên sản phẩm.';
      error.hidden = false;
      serialInput.setAttribute('aria-invalid', 'true');
      serialInput.focus();
      return;
    }
    serialInput.value = serial;
    message.textContent = `Mã ${serial} chưa thể được đối chiếu vì tra cứu trực tuyến chưa có dữ liệu bảo hành. Vui lòng kiểm tra tem sản phẩm, chứng từ mua hàng và xem hướng dẫn hỗ trợ bên dưới.`;
    result.hidden = false;
  });
})();
