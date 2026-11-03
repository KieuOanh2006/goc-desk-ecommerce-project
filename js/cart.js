(function (catalog, cart) {
  'use strict';
  const container = document.getElementById('gd-cart-items');
  const empty = document.getElementById('gd-cart-empty');
  const status = document.getElementById('gd-cart-status');
  const e = catalog.escapeHtml;

  function row(item) {
    const product = item.product;
    const color = item.color;
    const href = catalog.productUrl(product, color.id);
    const inputId = 'cart-qty-' + product.id + '-' + color.id;
    return `<article class="gd-cart-item" data-cart-line="${item.key}">
      <a class="gd-product-image" href="${href}" aria-label="Xem ${e(product.name)} — ${e(color.name)}"><img src="${color.image}" alt="${e(product.name)} — ${e(color.name)}" width="160" height="160"></a>
      <div class="gd-product-info"><span class="gd-product-code">${e(product.id.toUpperCase())}</span><h2><a href="${href}">${e(product.name)}</a></h2><p class="gd-variant"><span class="gd-swatch" style="background:${color.hex}" aria-hidden="true"></span>${e(color.name)}</p>${color.generated ? '<span class="gd-color-note">Phối màu minh họa</span>' : ''}</div>
      <div class="gd-unit-price"><span class="gd-mobile-label">Đơn giá</span>${catalog.money(item.unitPrice)}</div>
      <div class="gd-quantity"><label class="gd-sr-only" for="${inputId}">Số lượng ${e(product.name)} — ${e(color.name)}</label><input id="${inputId}" data-cart-quantity data-product="${product.id}" data-color="${color.id}" type="number" value="${item.quantity}" min="1" max="${cart.maxQuantity}" step="1" required><button type="button" data-remove-from-cart data-product="${product.id}" data-color="${color.id}" aria-label="Xóa ${e(product.name)} màu ${e(color.name)}">× Xóa</button></div>
      <strong class="gd-line-total"><span class="gd-mobile-label">Thành tiền</span>${catalog.money(item.total)}</strong></article>`;
  }
  function render() {
    try {
      const activeId = document.activeElement?.id;
      const summary = cart.summary();
      container.innerHTML = summary.items.map(row).join('');
      empty.hidden = summary.items.length > 0;
      document.getElementById('gd-table-head').hidden = !summary.items.length;
      document.getElementById('gd-cart-line-count').textContent = summary.items.length;
      document.getElementById('gd-cart-quantity-count').textContent = summary.quantity + ' sản phẩm';
      document.getElementById('gd-summary-count').textContent = '(' + summary.quantity + ' sản phẩm)';
      document.getElementById('gd-cart-subtotal').textContent = catalog.money(summary.subtotal);
      document.getElementById('gd-cart-total').textContent = catalog.money(summary.subtotal);
      if (activeId?.startsWith('cart-qty-')) document.getElementById(activeId)?.focus();
    } catch (_) {
      status.textContent = 'Chưa đọc được giỏ hàng. Vui lòng cho phép trình duyệt lưu dữ liệu của website rồi tải lại trang.';
    }
  }
  container.addEventListener('change', (event) => {
    const input = event.target.closest('input[data-cart-quantity]');
    if (!input || !input.reportValidity()) return;
    try {
      cart.update(input.dataset.product, input.dataset.color, Number(input.value));
      status.textContent = 'Đã cập nhật số lượng và tổng tiền.';
    } catch (error) {
      render();
      status.textContent = error.name === 'Error' ? error.message : 'Chưa lưu được thay đổi. Vui lòng thử lại.';
    }
  });
  container.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-remove-from-cart]');
    if (!button) return;
    try {
      cart.remove(button.dataset.product, button.dataset.color);
      status.textContent = 'Đã xóa sản phẩm khỏi giỏ hàng.';
    } catch (_) { status.textContent = 'Chưa xóa được sản phẩm. Vui lòng thử lại.'; }
  });
  cart.subscribe(render);
  window.addEventListener('pageshow', render);
  render();
})(globalThis.GocDeskCatalog, globalThis.GocDeskCart);
