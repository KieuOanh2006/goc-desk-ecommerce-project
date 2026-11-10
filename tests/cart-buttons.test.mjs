import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const sources = await Promise.all(['product-data', 'catalog-utils', 'cart-store', 'cart-buttons']
  .map((name) => readFile(new URL('../js/' + name + '.js', import.meta.url), 'utf8')));

function element() {
  const classes = new Set();
  return {
    dataset: {}, attributes: {}, textContent: '', hidden: false, disabled: false,
    classList: { toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
      remove(name) { classes.delete(name); }, contains(name) { return classes.has(name); } },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    querySelector() { return this.label ??= { textContent: 'Thêm vào giỏ hàng' }; },
  };
}

function setup() {
  const storage = new Map();
  const timers = new Map();
  let blocked = false;
  let timerId = 0;
  const context = vm.createContext({ Intl,
    document: { createElement: element },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem(key, value) {
        if (blocked) { const error = new Error('Storage is blocked'); error.name = 'SecurityError'; throw error; }
        storage.set(key, value);
      },
    },
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  });
  for (const source of sources) vm.runInContext(source, context);
  const catalog = context.GocDeskCatalog;
  const cart = context.GocDeskCart;
  const controls = context.GocDeskCartButtons;
  function grid(productIds = [catalog.products[0].id]) {
    const container = { placeholders: [], buttons: [], handlers: [],
      querySelectorAll() { return this.placeholders; },
      contains(button) { return this.buttons.includes(button); },
      addEventListener(_name, fn) { this.handlers.push(fn); },
    };
    for (const id of productIds) {
      const placeholder = { dataset: { cartProduct: id },
        replaceWith(button, note) {
          container.placeholders = container.placeholders.filter((item) => item !== placeholder);
          button.nextElementSibling = note;
          container.buttons.push(button);
        },
      };
      container.placeholders.push(placeholder);
    }
    controls.mount(container);
    return container;
  }
  function click(container, button = container.buttons[0]) {
    const event = { target: { closest: () => button }, prevented: false,
      preventDefault() { this.prevented = true; }, stopPropagation() {} };
    container.handlers.forEach((handler) => handler(event));
    return event;
  }
  return { catalog, cart, controls, grid, click, storage, timers,
    block(value) { blocked = value; },
    expireFeedback() { for (const fn of [...timers.values()]) fn(); },
  };
}

test('home and products share persistent lines, current catalog price and badge notifications', () => {
  const app = setup();
  const home = app.grid(); const products = app.grid();
  const product = app.catalog.products[0];
  let notifications = 0;
  app.cart.subscribe(() => notifications++);
  assert.equal(app.cart.summary().quantity, 0);
  assert.equal(app.click(home).prevented, true);
  app.click(products);
  assert.equal(app.cart.getItems().length, 1);
  assert.equal(app.cart.summary().quantity, 2);
  assert.equal(app.cart.summary().subtotal, product.price * 2);
  assert.equal(notifications, 2);
  assert.deepEqual(JSON.parse(app.storage.get(app.cart.key)), [
    { id: product.id, colorId: product.colors[0].id, quantity: 2 },
  ]);
});

test('quick add reads current catalog values and ignores stale DOM price, name and color', () => {
  const app = setup(); const grid = app.grid(); const button = grid.buttons[0];
  Object.assign(button.dataset, { productPrice: '1', productName: 'stale', productColor: 'missing' });
  const product = app.catalog.products[0];
  product.name = 'Tên cập nhật'; product.price = 123456;
  product.colors.reverse();
  app.click(grid);
  assert.equal(app.cart.getItems()[0].colorId, product.colors[0].id);
  assert.equal(app.cart.summary().subtotal, 123456);
  assert.match(button.attributes['aria-label'], /Tên cập nhật/);
});

test('every catalog item can be added without a per-product handler', () => {
  const app = setup(); const grid = app.grid(app.catalog.products.map((product) => product.id));
  for (const button of grid.buttons) app.click(grid, button);
  assert.equal(app.cart.getItems().length, app.catalog.products.length);
  assert.equal(app.cart.summary().subtotal, app.catalog.products.reduce((sum, product) => sum + product.price, 0));
});

test('mount is idempotent and supports newly rendered placeholders', () => {
  const app = setup(); const grid = app.grid();
  app.controls.mount(grid); app.controls.mount(grid);
  assert.equal(grid.buttons.length, 1); assert.equal(grid.handlers.length, 1);
  app.click(grid);
  assert.equal(app.cart.summary().quantity, 1);
  const next = app.grid([app.catalog.products[1].id]);
  app.click(next);
  assert.equal(app.cart.summary().quantity, 2);
});

test('disabled and unrelated buttons never add a product', () => {
  const app = setup(); const grid = app.grid();
  grid.buttons[0].disabled = true;
  app.click(grid); app.click(grid, element()); app.click(grid, null);
  assert.equal(app.cart.summary().quantity, 0);
});

test('storage failure reports an error, preserves cart, and allows retry', () => {
  const app = setup(); const grid = app.grid(); const button = grid.buttons[0];
  app.click(grid);
  app.block(true); app.click(grid);
  assert.equal(button.dataset.state, 'error');
  assert.equal(button.classList.contains('is-added'), false);
  assert.match(button.nextElementSibling.textContent, /quyền lưu dữ liệu/);
  assert.equal(button.disabled, false);
  assert.equal(button.attributes['aria-busy'], undefined);
  assert.equal(app.cart.summary().quantity, 1);
  app.block(false); app.click(grid);
  assert.equal(button.dataset.state, 'success');
  assert.equal(button.nextElementSibling.hidden, true);
  assert.equal(app.cart.summary().quantity, 2);
});

test('quantity limit and missing products fail without overwriting stored data', () => {
  const app = setup(); const grid = app.grid(); const product = app.catalog.products[0];
  app.cart.add(product.id, product.colors[0].id, app.cart.maxQuantity);
  const before = app.storage.get(app.cart.key);
  app.click(grid);
  assert.match(grid.buttons[0].nextElementSibling.textContent, /tối đa 99/);
  app.click(app.grid(['unknown']));
  assert.equal(app.storage.get(app.cart.key), before);
});

test('repeated feedback cancels the old timer and resets filtered-out buttons', () => {
  const app = setup(); const grid = app.grid(); const button = grid.buttons[0];
  app.click(grid); app.click(grid);
  assert.equal(app.timers.size, 1);
  button.isConnected = false;
  app.expireFeedback();
  assert.equal(button.dataset.state, undefined);
  assert.equal(button.classList.contains('is-added'), false);
  assert.equal(button.querySelector().textContent, 'Thêm vào giỏ hàng');
  assert.equal(button.attributes['aria-label'], `Thêm ${app.catalog.products[0].name} vào giỏ hàng`);
});

test('new catalog products generate home quick-add placeholders without editing HTML', () => {
  const app = setup();
  const product = { ...app.catalog.products[0], id: 'new-product', name: 'New product' };
  app.catalog.products.push(product);
  assert.match(app.catalog.homeCard(product), /data-cart-product="new-product"/);
  app.click(app.grid([product.id]));
  assert.equal(app.cart.getItems()[0].id, product.id);
});
