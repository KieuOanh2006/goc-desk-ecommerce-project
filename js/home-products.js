(function (catalog) {
  const grid = document.getElementById('home-products');
  if (grid) grid.innerHTML = catalog.products.map(catalog.homeCard).join('');
})(globalThis.GocDeskCatalog);
