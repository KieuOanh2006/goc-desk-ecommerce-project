(function (catalog) {
  'use strict';
  const form = document.getElementById('catalog-filters');
  const grid = document.getElementById('catalog-products');
  const count = document.getElementById('results-count');
  const empty = document.getElementById('catalog-empty');
  const sort = document.getElementById('catalog-sort');
  const search = document.getElementById('catalog-search');
  const status = document.getElementById('catalog-status');
  const end = document.getElementById('catalog-end');

  if (!catalog || !form || !grid || !count || !empty || !sort || !search || !status || !end) {
    console.error('products.js: thiếu dữ liệu hoặc phần tử HTML của trang Products');
    return;
  }

  globalThis.GocDeskCartButtons.mount(grid);

  // Keep original DOM nodes instead of replacing them with catalog.card().
  // This preserves the Quick Add buttons through filtering and sorting.
  const cards = new Map(
    Array.from(grid.querySelectorAll('.product-card')).map(card => [
      card.id.replace(/^card-/, ''), card
    ])
  );
  const params = new URLSearchParams(window.location.search);
  search.value = params.get('q') || '';
  for (const input of form.querySelectorAll('input[type="checkbox"]')) {
    input.checked = (params.get(input.name) || '').split(',').includes(input.value);
  }
  for (const input of form.querySelectorAll('input[name="price"]')) {
    input.checked = input.value === (params.get('price') || 'all');
  }
  sort.value = ['price-asc', 'price-desc', 'name'].includes(params.get('sort'))
    ? params.get('sort') : 'default';
  const headerSearch = document.querySelector('.search-bar input[name="q"]');
  if (headerSearch) headerSearch.value = search.value;

  function update(saveUrl = true) {
    const values = new FormData(form);
    const criteria = {
      q: search.value.trim(),
      categories: values.getAll('category'),
      brands: values.getAll('brand'),
      colors: values.getAll('color'),
      uses: values.getAll('use'),
      price: values.get('price'),
      sort: sort.value
    };
    const result = catalog.filterProducts(criteria);
    const fragment = document.createDocumentFragment();
    for (const product of result) {
      const id = product.id || product.productId || product.slug;
      const card = cards.get(id);
      if (card) {
        fragment.appendChild(card);
      } else {
        console.warn('Missing product card for:', id, product);
      }
    }
    grid.replaceChildren(fragment);
    count.textContent = result.length;
    empty.hidden = result.length > 0;
    end.hidden = result.length === 0;
    status.textContent = result.length + ' / ' + catalog.products.length +
      ' sản phẩm' + (criteria.q ? ' cho “' + criteria.q + '”' : '');

    if (saveUrl) {
      const next = new URL(window.location.href);
      next.search = '';
      if (criteria.q) next.searchParams.set('q', criteria.q);
      for (const [name, selected] of [
        ['category', criteria.categories], ['brand', criteria.brands],
        ['color', criteria.colors], ['use', criteria.uses]
      ]) {
        if (selected.length) next.searchParams.set(name, selected.join(','));
      }
      if (criteria.price && criteria.price !== 'all') next.searchParams.set('price', criteria.price);
      if (criteria.sort !== 'default') next.searchParams.set('sort', criteria.sort);
      try { window.history.replaceState(null, '', next); }
      catch (_) { /* file:// may prevent URL updates. */ }
    }
  }

  form.addEventListener('change', () => update());
  form.addEventListener('submit', event => event.preventDefault());
  search.addEventListener('input', () => update());
  sort.addEventListener('change', () => update());
  document.querySelectorAll('[data-clear-filters]').forEach(button => {
    button.addEventListener('click', () => {
      form.reset();
      search.value = '';
      sort.value = 'default';
      if (headerSearch) headerSearch.value = '';
      update();
    });
  });
  update(false);
})(globalThis.GocDeskCatalog);
