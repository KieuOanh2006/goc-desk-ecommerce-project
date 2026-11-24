/* Shared quick-add controls. Product data and cart persistence have separate owners. */
(function (root) {
  'use strict';

  const catalog = root.GocDeskCatalog;
  const cart = root.GocDeskCart;
  const mounted = new WeakSet();
  const feedbackTimers = new WeakMap();
  const label = 'Thêm vào giỏ hàng';
  const feedbackDuration = 1800;
  const icon = `<svg viewBox="0 0 24 24" width="18" height="18"
    fill="none" stroke="currentColor" stroke-width="1.8"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.7 13.3a2 2 0 0 0 2 1.7h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    <path d="M16 8v5m-2.5-2.5h5" /></svg>`;

  const productFor = (id) => catalog.products.find((product) => product.id === id);
  const accessibleLabel = (product) => product ? `Thêm ${product.name} vào giỏ hàng` : label;

  function feedback(button, message, success) {
    root.clearTimeout(feedbackTimers.get(button));
    const text = button.querySelector('span');
    const note = button.nextElementSibling;
    button.classList.toggle('is-added', success);
    button.dataset.state = success ? 'success' : 'error';
    button.setAttribute('aria-label', message);
    text.textContent = success ? 'Đã thêm vào giỏ hàng' : 'Không thể thêm';
    note.textContent = success ? '' : message;
    note.hidden = success;

    feedbackTimers.set(button, root.setTimeout(() => {
      // Reset detached cards too: filtering can put the same node back later.
      button.classList.remove('is-added');
      delete button.dataset.state;
      text.textContent = label;
      button.setAttribute('aria-label', accessibleLabel(productFor(button.dataset.productId)));
      feedbackTimers.delete(button);
    }, feedbackDuration));
  }

  function addToCart(button) {
    if (button.disabled) return;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      const product = productFor(button.dataset.productId);
      // Quick add uses the catalog's first color, as on the existing home page.
      const color = product?.colors[0];
      if (!product || !color) throw new Error('Sản phẩm hoặc màu đã chọn không hợp lệ.');
      cart.add(product.id, color.id, 1);
      feedback(button, `Đã thêm ${product.name} vào giỏ hàng`, true);
    } catch (error) {
      const message = error.name === 'QuotaExceededError' || error.name === 'SecurityError'
        ? 'Không thể lưu giỏ hàng. Vui lòng kiểm tra bộ nhớ hoặc quyền lưu dữ liệu của trình duyệt rồi thử lại.'
        : error.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.';
      feedback(button, message, false);
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  function mount(container) {
    if (!container) return;
    for (const placeholder of container.querySelectorAll('[data-cart-product]')) {
      const product = productFor(placeholder.dataset.cartProduct);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'card-add-to-cart';
      button.dataset.productId = placeholder.dataset.cartProduct;
      button.setAttribute('aria-label', accessibleLabel(product));
      button.innerHTML = icon + `<span>${label}</span>`;
      const note = document.createElement('p');
      note.className = 'card-cart-feedback';
      note.setAttribute('role', 'status');
      note.setAttribute('aria-live', 'polite');
      note.hidden = true;
      placeholder.replaceWith(button, note);
    }

    if (mounted.has(container)) return;
    mounted.add(container);
    container.addEventListener('click', (event) => {
      const button = event.target.closest('button.card-add-to-cart');
      if (!button || !container.contains(button)) return;
      event.preventDefault();
      event.stopPropagation();
      addToCart(button);
    });
  }

  root.GocDeskCartButtons = { mount };
})(globalThis);
