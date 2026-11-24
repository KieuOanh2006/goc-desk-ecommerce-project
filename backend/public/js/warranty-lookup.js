/* Tra cứu hiện chỉ kiểm tra định dạng; không tạo hoặc suy đoán dữ liệu bảo hành. */
(() => {
  const form = document.getElementById('warranty-lookup-form');
  const serialInput = document.getElementById('warranty-serial');
  const error = document.getElementById('warranty-serial-error');
  const result = document.getElementById('warranty-lookup-result');
  const message = document.getElementById('warranty-result-message');
  if (!form || !serialInput || !error || !result || !message) return;

  const journey = document.getElementById('warranty-journey');
  const journeyStatus = document.getElementById('warranty-journey-status');
  let checked = false;
  let movementTimer;
  let currentStep = 1;
  let currentPose = 'stand';
  const poses = ['stand', 'wave', 'sit', 'walk'];
  const setStep = (step, text) => {
    if (!journey || !journeyStatus) return;
    const changed = currentStep !== step;
    if (changed) {
      const alternatives = poses.filter((pose) => pose !== currentPose);
      currentPose = alternatives[Math.floor(Math.random() * alternatives.length)];
      journey.setAttribute('data-pose', currentPose);
    }
    currentStep = step;
    journey.setAttribute('data-step', String(step));
    journeyStatus.textContent = text;
    for (let index = 1; index <= 3; index += 1) {
      const milestone = document.getElementById('warranty-milestone-' + index);
      if (!milestone) continue;
      if (index === step) milestone.setAttribute('aria-current', 'step');
      else milestone.removeAttribute('aria-current');
    }
    const traveler = journey.querySelector('.warranty-traveler');
    if (traveler && changed) {
      traveler.classList.add('is-moving');
      clearTimeout(movementTimer);
      movementTimer = setTimeout(() => traveler.classList.remove('is-moving'), 1050);
    }
  };
  if (journey) {
    result.querySelector('a').addEventListener('click', () => {
      if (checked) setStep(3, 'Đã mở hướng dẫn — chuẩn bị thông tin để được hỗ trợ.');
    });
  }
  const clearFeedback = () => {
    error.hidden = true;
    error.textContent = '';
    serialInput.removeAttribute('aria-invalid');
    result.hidden = true;
    message.textContent = '';
  };

  serialInput.addEventListener('input', () => {
    clearFeedback();
    checked = false;
    setStep(1, serialInput.value.trim() ? 'Đang nhập mã — chọn “Kiểm tra” khi bạn sẵn sàng.' : 'Bắt đầu bằng mã Serial / IMEI của bạn.');
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFeedback();
    const serial = serialInput.value.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{3,63}$/.test(serial)) {
      error.textContent = serial
        ? 'Mã cần có 4–64 ký tự, gồm chữ, số hoặc các dấu - _ . /, không chứa khoảng trắng.'
        : 'Vui lòng nhập mã Serial hoặc IMEI trên sản phẩm.';
      checked = false;
      setStep(1, 'Kiểm tra lại mã để tiếp tục hành trình nhé.');
      error.hidden = false;
      serialInput.setAttribute('aria-invalid', 'true');
      serialInput.focus();
      return;
    }
    serialInput.value = serial;
    message.textContent = `Mã ${serial} chưa thể được đối chiếu vì tra cứu trực tuyến chưa có dữ liệu bảo hành. Vui lòng kiểm tra tem sản phẩm, chứng từ mua hàng và xem hướng dẫn hỗ trợ bên dưới.`;
    result.hidden = false;
    checked = true;
    setStep(2, 'Đã kiểm tra mã — xem phản hồi và mở hướng dẫn hỗ trợ bên dưới.');
  });
})();
