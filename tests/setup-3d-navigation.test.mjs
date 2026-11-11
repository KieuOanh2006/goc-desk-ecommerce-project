import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const read = name => readFile(new URL('../' + name, import.meta.url), 'utf8');

test('website entry links all target the canonical 3D studio', async () => {
  for (const name of ['index.html', 'account.html', 'news.html', 'product-detail.html', 'js/layout.js']) {
    const source = await read(name);
    const links = [...source.matchAll(/href="(setup-3d[^"\s]*)"/g)].map(match => match[1]);
    assert.ok(links.length > 0, name);
    for (const link of links) assert.ok(link.startsWith('setup-3d.html'), name + ': ' + link);
  }
});

test('catalog 3D links preserve the selected product and variant', async () => {
  const context = vm.createContext({ Intl });
  for (const name of ['product-data', 'catalog-utils']) vm.runInContext(await read('js/' + name + '.js'), context);
  const catalog = context.GocDeskCatalog;
  for (const product of catalog.products) {
    for (const color of product.colors) {
      const url = new URL(catalog.setupUrl(product, color.id), 'https://goc.test/');
      assert.equal(url.pathname, '/setup-3d.html');
      assert.equal(url.searchParams.get('product'), product.id);
      assert.equal(url.searchParams.get('color'), color.id);
      assert.equal(url.hash, '#setup-workspace');
    }
  }
});

test('canonical studio loads the shared favicon and stable 3D assets', async () => {
  const html = await read('setup-3d.html');
  assert.match(html, /<link rel="icon" type="image\/png" href="images\/favicon\.png">/);
  assert.doesNotMatch(html, /cap-nhat/);
  for (const asset of [
    'css/setup-3d-scene.css', 'css/setup-3d-hero.css',
    'js/setup-3d-hero.js', 'js/setup-3d-presets.js',
    'js/setup-3d-state.js', 'js/setup-3d-scene.js',
    'images/setup-3d-hero-cinematic.webp', 'images/setup-3d-bedroom.png',
    'images/setup-3d-window.png', 'images/setup-3d-balcony.png',
    'images/setup-3d-fallback.svg',
  ]) assert.ok(html.includes(asset), asset);
  const homepage = await read('index.html');
  assert.match(homepage, /<link rel="icon" type="image\/png" href="images\/favicon\.png">/);
  await stat(new URL('../images/favicon.png', import.meta.url));
});
