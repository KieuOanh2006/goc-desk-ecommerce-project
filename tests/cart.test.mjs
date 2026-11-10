import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
function element() {
  return { value: '', textContent: '', innerHTML: '', hidden: false, dataset: {}, attributes: {}, events: {},
    addEventListener(type, fn) { this.events[type] = fn; }, setAttribute(name, value) { this.attributes[name] = value; },
    focus() {}, scrollIntoView() {}, appendChild(node) { this.child = node; }, querySelector() { return this.child; },
  };
}

export async function run() {
  const sources = {};
  for (const name of ['product-data', 'catalog-utils', 'cart-store', 'cart-badge', 'product-detail', 'cart']) {
    sources[name] = await readFile(new URL('js/' + name + '.js', root), 'utf8');
    new vm.Script(sources[name], { filename: name + '.js' });
  }
  const passed = [];
  const check = (name, fn) => { fn(); passed.push(name); };
  const stored = new Map(); let blocked = false;
  const storage = { getItem: (key) => stored.get(key) || null, setItem(key, value) {
    if (blocked) { const error = new Error('quota'); error.name = 'QuotaExceededError'; throw error; }
    stored.set(key, value);
  } };
  const makeContext = () => {
    const context = vm.createContext({ localStorage: storage, Intl, URL, URLSearchParams });
    for (const name of ['product-data', 'catalog-utils', 'cart-store']) vm.runInContext(sources[name], context);
    return context;
  };
  const context = makeContext(); const cart = context.GocDeskCart; const catalog = context.GocDeskCatalog;
  const keyboard = catalog.products[0]; const lamp = catalog.products[2];
  const clear = () => stored.clear();
  check('New cart is empty; no seeded demo products', () => assert.equal(cart.summary().quantity, 0));
  check('Same product and color accumulate quantities', () => {
    cart.add(keyboard.id, 'cream', 2); cart.add(keyboard.id, 'cream', 3);
    assert.equal(cart.getItems().length, 1); assert.equal(cart.summary().quantity, 5);
    assert.equal(cart.summary().subtotal, keyboard.price * 5);
  });
  check('Different colors and different products remain separate', () => {
    cart.add(keyboard.id, 'black', 1); cart.add(lamp.id, 'sage', 2);
    assert.equal(cart.getItems().length, 3); assert.equal(cart.summary().quantity, 8);
    assert.equal(cart.getItems()[0].color.image, keyboard.colors[1].image);
  });
  check('Saved cart survives a new page context', () => assert.equal(makeContext().GocDeskCart.summary().quantity, 8));
  check('Invalid inputs never change saved quantities', () => {
    const before = stored.get(cart.key);
    for (const quantity of [0, -1, 1.5, 100, NaN, Infinity]) assert.throws(() => cart.add(keyboard.id, 'black', quantity));
    assert.throws(() => cart.add('missing', 'black', 1)); assert.throws(() => cart.add(keyboard.id, 'missing', 1));
    assert.equal(stored.get(cart.key), before);
  });
  check('Quantity limit rejects overflow without losing the cart', () => {
    clear(); cart.add(keyboard.id, 'black', 99); assert.throws(() => cart.add(keyboard.id, 'black', 1));
    assert.equal(cart.summary().quantity, 99);
  });
  check('Stored prices are ignored; unknown lines are discarded', () => {
    stored.set(cart.key, JSON.stringify([{ id: keyboard.id, colorId: 'cream', quantity: 2, price: 1 }, { id: 'unknown', colorId: 'black', quantity: 3 }]));
    assert.equal(cart.getItems().length, 1); assert.equal(cart.summary().subtotal, keyboard.price * 2);
    assert.equal(cart.getItems()[0].unitPrice, keyboard.price);
  });
  check('Changing quantity and removing the last item update totals', () => {
    cart.update(keyboard.id, 'cream', 3); assert.equal(cart.summary().subtotal, keyboard.price * 3);
    cart.remove(keyboard.id, 'cream'); assert.equal(cart.summary().subtotal, 0); assert.equal(cart.summary().quantity, 0);
  });
  check('Storage failure does not report a successful add', () => {
    blocked = true; assert.throws(() => cart.add(keyboard.id, 'cream', 1)); blocked = false;
    assert.equal(cart.summary().quantity, 0);
  });

  // Exercise the production detail, badge and cart-page handlers with a DOM adapter.
  const articles = new Map(); const nodes = new Map(); const link = element();
  for (const p of catalog.products) {
    const article = element(); const fields = new Map();
    fields.set('.detail-price', element());
    for (const name of ['data-gallery-image', 'data-gallery-label', 'data-color-name', 'data-spec-color', 'data-gallery-note', 'data-setup-link', 'data-review-list', 'data-review-summary', 'data-review-form', 'data-review-status', 'data-purchase-quantity', 'data-cart-status']) fields.set('[' + name + ']', element());
    const form = fields.get('[data-review-form]'); form.reportValidity = () => true; form.reset = () => {};
    const quantity = fields.get('[data-purchase-quantity]'); quantity.value = '1'; quantity.reportValidity = () => true;
    const buttons = p.colors.flatMap((color) => [0, 1].map(() => ({ ...element(), dataset: { color: color.id } })));
    article.querySelector = (selector) => fields.get(selector); article.querySelectorAll = () => buttons;
    article.fields = fields; articles.set(p.id, article);
  }
  const doc = { getElementById: (id) => articles.get(id) || nodes.get(id), title: '', activeElement: null,
    readyState: 'complete', addEventListener() {},
    querySelectorAll: () => [link], createElement: () => element() };
  const win = { location: new URL('https://goc.test/product-detail.html?color=sage#nova-dl02'), localStorage: storage,
    history: { replaceState(_s, _t, url) { win.location = new URL(url); } }, matchMedia: () => ({ matches: true }), addEventListener() {} };
  context.document = doc; context.window = win;
  vm.runInContext(sources['cart-badge'], context); vm.runInContext(sources['product-detail'], context);
  const lampArticle = articles.get(lamp.id);
  const click = (selector, dataset = {}) => lampArticle.events.click({ preventDefault() {}, target: { closest: (target) => target === selector ? { dataset } : null } });
  check('Add button saves selected color and quantity without navigation', () => {
    lampArticle.fields.get('[data-purchase-quantity]').value = '2';
    const before = win.location.href; click('button[data-add-to-cart]');
    assert.equal(win.location.href, before); assert.equal(cart.getItems()[0].colorId, 'sage'); assert.equal(cart.getItems()[0].quantity, 2);
    assert.equal(lampArticle.fields.get('[data-cart-status]').dataset.state, 'success'); assert.equal(link.child.textContent, '2');
  });
  check('Repeated add updates badge; switching color creates another row', () => {
    click('button[data-add-to-cart]'); click('button[data-color]', { color: 'white' });
    lampArticle.fields.get('[data-purchase-quantity]').value = '1'; const before = win.location.href; click('button[data-add-to-cart]');
    assert.equal(win.location.href, before); assert.equal(cart.getItems().length, 2); assert.equal(cart.summary().quantity, 5); assert.equal(link.child.textContent, '5');
  });
  check('Failed write shows an error and leaves badge and saved cart unchanged', () => {
    blocked = true; click('button[data-add-to-cart]'); blocked = false;
    assert.equal(lampArticle.fields.get('[data-cart-status]').dataset.state, 'error'); assert.equal(cart.summary().quantity, 5); assert.equal(link.child.textContent, '5');
  });
  for (const id of ['gd-cart-items', 'gd-cart-empty', 'gd-cart-status', 'gd-table-head', 'gd-cart-line-count', 'gd-cart-quantity-count', 'gd-summary-count', 'gd-cart-subtotal', 'gd-cart-total']) nodes.set(id, element());
  vm.runInContext(sources.cart, context);
  check('Cart page renders saved colors, quantities, images and totals', () => {
    const html = nodes.get('gd-cart-items').innerHTML;
    assert.ok(html.includes(lamp.colors[1].image)); assert.ok(html.includes('value="4"'));
    assert.equal(nodes.get('gd-cart-total').textContent, catalog.money(lamp.price * 5)); assert.equal(nodes.get('gd-cart-empty').hidden, true);
  });
  check('Cart-page quantity change updates stored data and subtotal', () => {
    nodes.get('gd-cart-items').events.change({ target: { closest: () => ({ dataset: { product: lamp.id, color: 'sage' }, value: '3', reportValidity: () => true }) } });
    assert.equal(cart.summary().quantity, 4); assert.equal(nodes.get('gd-cart-total').textContent, catalog.money(lamp.price * 4));
  });
  check('Removing every saved row shows the empty state and clears badge', () => {
    for (const color of ['sage', 'white']) nodes.get('gd-cart-items').events.click({ target: { closest: () => ({ dataset: { product: lamp.id, color } }) } });
    assert.equal(cart.summary().quantity, 0); assert.equal(nodes.get('gd-cart-empty').hidden, false); assert.equal(link.child.hidden, true);
  });
  return { passed: passed.length, checks: passed };
}
