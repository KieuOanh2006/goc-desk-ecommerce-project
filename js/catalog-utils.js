(function (catalog) {
  'use strict';
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
  const categoryName = (id) => catalog.categories.find((category) => category.id === id)?.name || '';
  const productUrl = (product, color) => 'product-detail.html' + (color ? '?color=' + encodeURIComponent(color) : '') + '#' + product.id;
  const setupUrl = (product, color) => 'setup-3d.html?product=' + encodeURIComponent(product.id) + '&color=' + encodeURIComponent(color || product.colors[0].id) + '#setup-workspace';

  function filterProducts(criteria = {}, items = catalog.products) {
    const selected = (values, value) => !values?.length || values.includes(value);
    const terms = normalize(criteria.q || '').trim().split(/\s+/).filter(Boolean);
    const result = items.filter((product) => {
      const searchable = normalize([product.name, product.fullName, product.description, product.brand, categoryName(product.category)].join(' '));
      const priceMatches = !criteria.price || criteria.price === 'all'
        || criteria.price === 'under300' && product.price < 300000
        || criteria.price === '300to700' && product.price >= 300000 && product.price <= 700000
        || criteria.price === 'over700' && product.price > 700000;
      return terms.every((term) => searchable.includes(term))
        && selected(criteria.categories, product.category)
        && selected(criteria.brands, product.brand)
        && (!criteria.colors?.length || product.colors.some((color) => criteria.colors.includes(color.id)))
        && (!criteria.uses?.length || product.uses.some((use) => criteria.uses.includes(use)))
        && priceMatches;
    });
    if (criteria.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    if (criteria.sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    if (criteria.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    return result;
  }

  function card(product) {
    return `<article class="product-card" id="card-${product.id}"><a class="card-link" href="${productUrl(product)}">
      <div class="card-image"><img src="${product.image}" alt="${escapeHtml(product.fullName)}" width="600" height="600" loading="lazy"><span class="card-arrow" aria-hidden="true">↗</span></div>
      <div class="card-copy"><span class="eyebrow">${escapeHtml(categoryName(product.category))} · ${escapeHtml(product.brand)}</span><h3>${escapeHtml(product.name)}</h3>
      <p class="card-description">${escapeHtml(product.description)}</p><p class="price">${money(product.price)}</p>
      <span class="variant">${product.colors.length} màu để khám phá</span><span class="card-swatches" aria-hidden="true">${product.colors.map((color) => `<i style="--swatch:${color.hex}"></i>`).join('')}</span></div></a></article>`;
  }

  function homeCard(product) {
    return `<article class="arrival-card"><a href="${productUrl(product)}" class="arrival-image"><img src="${product.image}" width="600" height="600" alt="${escapeHtml(product.fullName)}" loading="lazy" decoding="async"><span class="product-badge">${product.colors.length} màu</span></a>
      <p class="arrival-type">${escapeHtml(categoryName(product.category))}</p><h3><a href="${productUrl(product)}">${escapeHtml(product.name)}</a></h3><p class="arrival-price">${money(product.price)}</p></article>`;
  }
  Object.assign(catalog, { escapeHtml, normalize, money, categoryName, productUrl, setupUrl, filterProducts, card, homeCard });
})(globalThis.GocDeskCatalog);
