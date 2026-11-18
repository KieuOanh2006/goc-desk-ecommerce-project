/* Đăng nhập frontend mẫu. API quản trị phải xác thực và phân quyền ở máy chủ. */
(() => {
  const sessionKey = 'gocdesk.admin.preview';
  const roles = {
  "c1a79fb99d0fc8f799684a371fe5f9bbe9d9b226a25a0e9c1ae2abb68f39be26": {
    "role": "dashboard",
    "url": "admin-dashboard.html"
  },
  "8a0d7ed1e6e06b08d94d2a50a70a015596d9e0106df7c4425ade8ae76ab68961": {
    "role": "customers",
    "url": "admin-customers.html"
  },
  "a31002dddadc48f9c85fcd9a3870a8bead0b452212169a4db4c64e5b640724b2": {
    "role": "products",
    "url": "admin-products.html"
  }
};
  const form = document.getElementById('admin-login-form');
  if (form) {
    const password = document.getElementById('admin-password');
    const status = document.getElementById('admin-login-status');
    const submit = form.querySelector('button[type="submit"]');
    password.addEventListener('input', () => { status.textContent = ''; password.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      status.textContent = '';
      password.removeAttribute('aria-invalid');
      if (!password.value) { status.textContent = 'Vui lòng nhập mật khẩu admin.'; password.setAttribute('aria-invalid', 'true'); password.focus(); return; }
      submit.disabled = true;
      try {
        const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password.value));
        const digest = Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
        const match = roles[digest];
        if (!match) { status.textContent = 'Mật khẩu admin không đúng. Vui lòng thử lại.'; password.setAttribute('aria-invalid', 'true'); password.focus(); return; }
        sessionStorage.setItem(sessionKey, JSON.stringify({ role: match.role, expires: Date.now() + 8 * 60 * 60 * 1000 }));
        password.value = '';
        window.location.assign(match.url);
      } catch { status.textContent = 'Chưa thể mở phiên đăng nhập. Vui lòng thử lại trên trình duyệt có bật lưu trữ phiên.'; }
      finally { submit.disabled = false; }
    });
  }
  const area = document.getElementById('admin-area');
  if (area) {
    let session;
    try { session = JSON.parse(sessionStorage.getItem(sessionKey)); } catch {}
    if (!session || session.role !== area.dataset.adminRole || session.expires <= Date.now()) {
      window.location.replace('account.html#admin');
      return;
    }
    area.hidden = false;
    document.getElementById('admin-logout').addEventListener('click', () => {
      sessionStorage.removeItem(sessionKey);
      window.location.replace('account.html#admin');
    });
  }
})();
