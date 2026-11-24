(function (catalog) {
  const params = new URLSearchParams(window.location.search);
  const product = catalog.products.find((product) => product.id === params.get('product'));
  if (!product) return;
  const color = product.colors.find((color) => color.id === params.get('color')) || product.colors[0];
  const selection = document.getElementById('setup-selection');
  selection.hidden = false;
  selection.innerHTML = `<p class="setup-selection-label">Sản phẩm bạn đang tham khảo</p><div class="setup-selection-product"><img src="${color.image}" alt="${catalog.escapeHtml(product.name + ' — ' + color.name)}" width="80" height="80"><div><strong>${catalog.escapeHtml(product.name)}</strong><span>${catalog.escapeHtml(color.name)}${color.generated ? ' · Màu minh họa' : ''}</span><span>${catalog.money(product.price)} · Giá màu gốc</span></div></div><a href="${catalog.productUrl(product, color.id)}">← Quay lại sản phẩm và màu đã chọn</a>`;
})(globalThis.GocDeskCatalog);
