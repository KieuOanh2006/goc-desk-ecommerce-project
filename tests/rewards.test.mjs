import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const key = 'goc-desk:reward-wishlist:v1';

function mockPage(source, options = {}) {
  class Element {
    constructor(dataset = {}) { Object.assign(this, { dataset, attrs: {}, events: {}, textContent: '', disabled: false, hidden: false, open: false, focused: 0 }); }
    addEventListener(type, handler) { (this.events[type] ||= []).push(handler); }
    fire(type, event = {}) { for (const handler of this.events[type] || []) handler(event); }
    click() { if (!this.disabled) this.fire('click', { target: this }); }
    setAttribute(name, value) { this.attrs[name] = String(value); if (name === 'open') this.open = true; }
    getAttribute(name) { return this.attrs[name] ?? null; }
    removeAttribute(name) { delete this.attrs[name]; if (name === 'open') this.open = false; }
    focus() { this.focused += 1; }
  }
  const cards = [
    new Element({ rewardId: 'gift-a', rewardType: 'gift', rewardTitle: 'Túi vải', rewardPoints: '1000' }),
    new Element({ rewardId: 'gift-b', rewardType: 'gift', rewardTitle: 'Khay gỗ', rewardPoints: '2000' }),
    new Element({ rewardId: 'voucher-a', rewardType: 'voucher', rewardTitle: 'Ưu đãi phụ kiện', rewardPoints: '500' }),
  ];
  const filters = ['all', 'gift', 'voucher'].map(rewardFilter => new Element({ rewardFilter }));
  filters[0].attrs['aria-pressed'] = 'true';
  const buttons = cards.map(card => new Element({ openReward: card.dataset.rewardId }));
  const nodes = Object.fromEntries(['reward-dialog', 'reward-dialog-title', 'reward-dialog-cost', 'reward-dialog-note', 'reward-dialog-status', 'reward-save', 'reward-results-status'].map(id => [id, new Element()]));
  const dialog = nodes['reward-dialog'];
  const closer = new Element();
  dialog.querySelectorAll = () => [closer];
  if (!options.fallback) {
    dialog.showModal = () => { if (options.modalThrows) throw new Error('Modal unavailable'); dialog.setAttribute('open', ''); };
    dialog.close = () => { dialog.removeAttribute('open'); dialog.fire('close'); };
  }
  const stored = new Map();
  if (options.raw !== undefined) stored.set(key, options.raw);
  let writes = 0;
  const events = {};
  const window = {
    localStorage: {
      getItem(name) { if (options.readBlocked) throw new Error('Storage blocked'); return stored.get(name) ?? null; },
      setItem(name, value) { writes += 1; if (options.writeBlocked) throw new Error('Quota exceeded'); if (!options.noWrite) stored.set(name, value); },
    },
    addEventListener(type, handler) { (events[type] ||= []).push(handler); },
  };
  const document = {
    querySelectorAll(selector) { return selector === '[data-reward-id]' ? cards : selector === '#reward-filters [data-reward-filter]' ? filters : selector === '[data-open-reward]' ? buttons : []; },
    getElementById(id) { return nodes[id] || null; },
  };
  vm.runInNewContext(source, { document, window }, { filename: 'rewards.js' });
  return { cards, filters, buttons, nodes, dialog, closer, stored, get writes() { return writes; }, storageEvent(name = key) { for (const handler of events.storage || []) handler({ key: name }); } };
}

export async function run() {
  const source = await readFile(new URL('../js/rewards.js', import.meta.url), 'utf8');
  new vm.Script(source, { filename: 'rewards.js' });
  const checks = [];
  const check = (name, fn) => { fn(); checks.push(name); };

  check('Reward filters update visibility, aria and result counts', () => {
    const page = mockPage(source);
    assert.equal(page.nodes['reward-results-status'].textContent, '3 lựa chọn · Tất cả quà');
    page.filters[1].click();
    assert.deepEqual(page.cards.map(card => card.hidden), [false, false, true]);
    assert.equal(page.filters[1].attrs['aria-pressed'], 'true');
    assert.equal(page.cards[2].attrs['aria-hidden'], 'true');
    assert.equal(page.nodes['reward-results-status'].textContent, '2 lựa chọn · Quà tặng');
    page.filters[2].click(); assert.deepEqual(page.cards.map(card => card.hidden), [true, true, false]);
    page.filters[0].click(); assert.ok(page.cards.every(card => !card.hidden));
  });
  check('Dialog uses source reward details and explains that points are not connected', () => {
    const page = mockPage(source); page.buttons[0].click();
    assert.ok(page.dialog.open);
    assert.equal(page.nodes['reward-dialog-title'].textContent, 'Túi vải');
    assert.equal(page.nodes['reward-dialog-cost'].textContent, '1.000 điểm');
    assert.match(page.nodes['reward-dialog-note'].textContent, /chưa được kết nối/);
    page.closer.click(); assert.equal(page.dialog.open, false); assert.equal(page.buttons[0].focused, 1);
  });
  check('Wishlist saves only allowed IDs, survives reload and avoids duplicate writes', () => {
    const page = mockPage(source, { raw: JSON.stringify(['gift-a', 'unknown', false, 'gift-a']) });
    assert.equal(page.buttons[0].textContent, 'Đã lưu · Xem lại');
    page.buttons[1].click(); page.nodes['reward-save'].click();
    assert.deepEqual(JSON.parse(page.stored.get(key)), ['gift-a', 'gift-b']);
    assert.ok(page.nodes['reward-save'].disabled);
    page.nodes['reward-save'].click(); assert.equal(page.writes, 1);
    const reloaded = mockPage(source, { raw: page.stored.get(key) });
    assert.equal(reloaded.buttons[1].textContent, 'Đã lưu · Xem lại');
  });
  check('Blocked, full, corrupted or non-persisting storage never reports a saved reward', () => {
    for (const options of [{ readBlocked: true }, { writeBlocked: true }, { noWrite: true }, { raw: 'broken JSON' }]) {
      const page = mockPage(source, options); const initialAction = page.buttons[0].textContent;
      page.buttons[0].click(); page.nodes['reward-save'].click();
      assert.equal(page.nodes['reward-dialog-status'].dataset.state, 'error');
      assert.equal(page.nodes['reward-save'].disabled, false);
      assert.equal(page.buttons[0].textContent, initialAction);
      assert.notEqual(page.buttons[0].dataset.rewardSaved, 'true');
    }
  });
  check('Dialog fallback supports open, Escape and focus return', () => {
    for (const options of [{ fallback: true }, { modalThrows: true }]) {
      const page = mockPage(source, options); page.buttons[0].click(); assert.ok(page.dialog.open);
      page.dialog.fire('keydown', { key: 'Escape', preventDefault() {} });
      assert.equal(page.dialog.open, false); assert.equal(page.buttons[0].focused, 1);
    }
  });
  check('Cross-tab wishlist changes refresh card and dialog saved states', () => {
    const page = mockPage(source); page.buttons[0].click(); const initialAction = page.buttons[0].textContent;
    page.stored.set(key, JSON.stringify(['gift-a'])); page.storageEvent();
    assert.equal(page.buttons[0].textContent, 'Đã lưu · Xem lại'); assert.ok(page.nodes['reward-save'].disabled);
    page.stored.delete(key); page.storageEvent(null);
    assert.equal(page.buttons[0].textContent, initialAction); assert.equal(page.nodes['reward-save'].disabled, false);
  });
  return { passed: checks.length, checks };
}
