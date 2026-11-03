(function (catalog) {
  'use strict';
  const form = document.getElementById('catalog-filters');
  const grid = document.getElementById('catalog-products');
  const count = document.getElementById('results-count');
  const empty = document.getElementById('catalog-empty');
  const sort = document.getElementById('catalog-sort');
  const search = document.getElementById('catalog-search');
  const status = document.getElementById('catalog-status');
  const params = new URLSearchParams(window.location.search);
  search.value = params.get('q') || '';
  for (const input of form.querySelectorAll('input[type="checkbox"]')) {
    input.checked = (params.get(input.name) || '').split(',').includes(input.value);
  }
  for (const input of form.querySelectorAll('input[name="price"]')) input.checked = input.value === (params.get('price') || 'all');
  sort.value = ['price-asc', 'price-desc', 'name'].includes(params.get('sort')) ? params.get('sort') : 'default';
  const headerSearch = document.querySelector('.search-bar input[name="q"]');
  if (headerSearch) headerSearch.value = search.value;

  function update(saveUrl = true) {
    const values = new FormData(form);
    const criteria = { q: search.value.trim(), categories: values.getAll('category'), brands: values.getAll('brand'), colors: values.getAll('color'), uses: values.getAll('use'), price: values.get('price'), sort: sort.value };
    const result = catalog.filterProducts(criteria);
    grid.innerHTML = result.map(catalog.card).join('');
    count.textContent = result.length;
    empty.hidden = result.length > 0;
    document.getElementById('catalog-end').hidden = !result.length;
    status.textContent = result.length + ' / ' + catalog.products.length + ' sản phẩm' + (criteria.q ? ' cho “' + criteria.q + '”' : '');
    if (saveUrl) {
      const next = new URL(window.location.href);
      next.search = '';
      if (criteria.q) next.searchParams.set('q', criteria.q);
      for (const [name, selected] of [['category', criteria.categories], ['brand', criteria.brands], ['color', criteria.colors], ['use', criteria.uses]]) if (selected.length) next.searchParams.set(name, selected.join(','));
      if (criteria.price && criteria.price !== 'all') next.searchParams.set('price', criteria.price);
      if (criteria.sort !== 'default') next.searchParams.set('sort', criteria.sort);
      try { window.history.replaceState(null, '', next); } catch (_) { /* file:// có thể giới hạn thay đổi URL. */ }
    }
  }
  form.addEventListener('change', () => update());
  form.addEventListener('submit', (event) => event.preventDefault());
  search.addEventListener('input', () => update());
  sort.addEventListener('change', () => update());
  document.querySelectorAll('[data-clear-filters]').forEach((button) => button.addEventListener('click', () => {
    form.reset(); search.value = ''; sort.value = 'default';
    if (headerSearch) headerSearch.value = '';
    update();
  }));
  update(false);
})(globalThis.GocDeskCatalog);
