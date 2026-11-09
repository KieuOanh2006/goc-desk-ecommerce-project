(function (catalog) {
  'use strict';
  const params = () => new URLSearchParams(window.location.search);
  const selectedColors = new Map();

  function selectColor(article, product, color, saveUrl = false) {
    selectedColors.set(product.id, color.id);
    article.querySelector('.detail-price').textContent = catalog.money(product.price);
    const image = article.querySelector('[data-gallery-image]');
    image.src = color.image;
    image.alt = product.name + ' — ' + color.name;
    article.querySelector('[data-gallery-label]').textContent = color.name;
    article.querySelector('[data-color-name]').textContent = color.name;
    article.querySelector('[data-spec-color]').textContent = color.name + (color.generated ? ' (phối màu minh họa)' : '');
    article.querySelector('[data-gallery-note]').textContent = color.generated
      ? color.name + ' · Phối màu minh họa thiết kế bởi Góc Desk'
      : color.name + ' · Ảnh sản phẩm gốc';
    article.querySelector('[data-setup-link]').href = catalog.setupUrl(product, color.id);
    for (const button of article.querySelectorAll('[data-color]')) button.setAttribute('aria-pressed', String(button.dataset.color === color.id));
    if (saveUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('color', color.id);
      url.hash = product.id;
      try { window.history.replaceState(null, '', url); } catch (_) { /* Lựa chọn vẫn hoạt động trên file://. */ }
    }
  }

  function activeProduct() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (_) { id = ''; }
    return catalog.products.find((product) => product.id === id) || catalog.products[0];
  }
  function activate() {
    const product = activeProduct();
    const color = product.colors.find((color) => color.id === params().get('color')) || product.colors[0];
    selectColor(document.getElementById(product.id), product, color);
    document.title = product.name + ' | Góc Desk';
  }

  for (const product of catalog.products) {
    const article = document.getElementById(product.id);
    article.addEventListener('click', (event) => {
      const addButton = event.target.closest('button[data-add-to-cart]');
      if (addButton) {
        event.preventDefault();
        const quantityInput = article.querySelector('[data-purchase-quantity]');
        const status = article.querySelector('[data-cart-status]');
        if (!quantityInput.reportValidity()) return;
        const quantity = Number(quantityInput.value);
        const colorId = selectedColors.get(product.id) || product.colors[0].id;
        try {
          globalThis.GocDeskCart.add(product.id, colorId, quantity);
          const color = product.colors.find((color) => color.id === colorId);
          status.dataset.state = 'success';
          status.textContent = 'Đã thêm ' + quantity + ' × ' + product.name + ' — ' + color.name + ' vào giỏ hàng.';
        } catch (error) {
          status.dataset.state = 'error';
          status.textContent = error.name === 'Error' ? error.message : 'Chưa thể lưu giỏ hàng trên trình duyệt này. Vui lòng thử lại.';
        }
      }
      const choice = event.target.closest('button[data-color]');
      if (choice) {
        const color = product.colors.find((color) => color.id === choice.dataset.color);
        if (color) selectColor(article, product, color, true);
      }
      const section = event.target.closest('button[data-section]');
      if (section) {
        // Không đổi hash: hash hiện tại xác định sản phẩm đang mở.
        const target = document.getElementById(section.dataset.section);
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }
    });
    const key = 'goc-desk:reviews:v1:' + product.id;
    let reviews = [];
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) || '[]');
      if (Array.isArray(saved)) reviews = saved.filter((review) => Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5
        && typeof review.comment === 'string' && review.comment.length <= 1000
        && typeof review.name === 'string' && review.name.length <= 60
        && typeof review.date === 'string' && Number.isFinite(Date.parse(review.date))).slice(0, 100);
    } catch (_) { /* Không có bộ nhớ cục bộ: vẫn cho nhập phản hồi trong phiên. */ }
    const renderReviews = () => {
      const list = article.querySelector('[data-review-list]');
      article.querySelector('[data-review-summary]').textContent = reviews.length
        ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1) + ' / 5 · ' + reviews.length + ' phản hồi trên thiết bị này'
        : 'Chưa có đánh giá';
      list.innerHTML = reviews.length ? reviews.map((review) => `<article class="review-entry"><div><strong>${catalog.escapeHtml(review.name)}</strong><span aria-label="${review.rating} trên 5 sao">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span></div><p>${catalog.escapeHtml(review.comment)}</p><time datetime="${catalog.escapeHtml(review.date)}">${new Date(review.date).toLocaleDateString('vi-VN')}</time></article>`).join('')
        : '<p class="reviews-empty">Chưa có phản hồi cho sản phẩm này. Hãy chia sẻ trải nghiệm đầu tiên của bạn.</p>';
    };
    renderReviews();
    const form = article.querySelector('[data-review-form]');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const comment = String(values.get('comment') || '').trim();
      const rating = Number(values.get('rating'));
      const status = article.querySelector('[data-review-status]');
      if (comment.length < 10 || comment.length > 1000 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        status.textContent = 'Chọn từ 1–5 sao và viết nhận xét từ 10–1.000 ký tự.';
        return;
      }
      const review = { name: String(values.get('name') || '').trim().slice(0, 60) || 'Khách trải nghiệm', rating, comment, date: new Date().toISOString() };
      reviews = [review, ...reviews].slice(0, 100);
      let persisted = true;
      try { window.localStorage.setItem(key, JSON.stringify(reviews)); } catch (_) { persisted = false; }
      renderReviews();
      form.reset();
      status.textContent = persisted ? 'Đã lưu phản hồi trên trình duyệt này. Cảm ơn bạn đã chia sẻ!' : 'Đã thêm phản hồi cho phiên xem này; trình duyệt không cho phép lưu lâu dài.';
    });
  }
  window.addEventListener('hashchange', activate);
  activate();
})(globalThis.GocDeskCatalog);
