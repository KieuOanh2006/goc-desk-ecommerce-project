(function (catalog) {
  const categories = document.getElementById('home-categories');
  if (categories) categories.innerHTML = catalog.categories.map(catalog.categoryCard).join('');
  const grid = document.getElementById('home-products');
  if (grid) grid.innerHTML = catalog.products.map(catalog.homeCard).join('');
  for (const banner of document.querySelectorAll('[data-featured-product]')) {
    const product = catalog.products.find((product) => product.id === banner.dataset.featuredProduct);
    if (product) banner.innerHTML = catalog.featuredCard(product, banner.dataset.featuredColor);
  }
})(globalThis.GocDeskCatalog);
