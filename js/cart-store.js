/* Chỉ lưu mã sản phẩm, màu và số lượng; giá/ảnh luôn lấy từ danh mục. */
(function (root) {
  'use strict';
  const key = 'goc-desk:cart:v1';
  const maxQuantity = 99;
  const listeners = new Set();
  const products = root.GocDeskCatalog.products;
  const productFor = (id) => products.find((product) => product.id === id);
  const lineKey = (id, colorId) => id + ':' + colorId;
  const quantityIsValid = (quantity) => Number.isInteger(quantity) && quantity >= 1 && quantity <= maxQuantity;

  function normalize(rows) {
    const lines = new Map();
    if (!Array.isArray(rows)) return [];
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const product = productFor(row.id);
      if (!product || !product.colors.some((color) => color.id === row.colorId) || !quantityIsValid(row.quantity)) continue;
      const id = lineKey(row.id, row.colorId);
      const previous = lines.get(id);
      lines.set(id, { id: row.id, colorId: row.colorId, quantity: Math.min(maxQuantity, row.quantity + (previous?.quantity || 0)) });
    }
    return Array.from(lines.values());
  }
  function read() {
    const raw = root.localStorage.getItem(key);
    if (!raw) return [];
    try { return normalize(JSON.parse(raw)); } catch (_) { return []; }
  }
  function expand(rows) {
    return rows.map((row) => {
      const product = productFor(row.id);
      const color = product.colors.find((color) => color.id === row.colorId);
      return { ...row, key: lineKey(row.id, row.colorId), product, color, unitPrice: product.price, total: product.price * row.quantity };
    });
  }
  function notify() { for (const listener of listeners) listener(); }
  function save(rows) {
    // Không báo thành công nếu trình duyệt từ chối ghi bộ nhớ.
    root.localStorage.setItem(key, JSON.stringify(rows));
    notify();
    return expand(rows);
  }
  function validate(id, colorId, quantity) {
    const product = productFor(id);
    if (!product || !product.colors.some((color) => color.id === colorId)) throw new Error('Sản phẩm hoặc màu đã chọn không hợp lệ.');
    if (!quantityIsValid(quantity)) throw new Error('Vui lòng chọn số lượng nguyên từ 1 đến ' + maxQuantity + '.');
  }
  function add(id, colorId, quantity = 1) {
    validate(id, colorId, quantity);
    const rows = read();
    const row = rows.find((row) => row.id === id && row.colorId === colorId);
    if (row) {
      if (row.quantity + quantity > maxQuantity) throw new Error('Mỗi sản phẩm và màu được thêm tối đa ' + maxQuantity + ' món.');
      row.quantity += quantity;
    } else rows.push({ id, colorId, quantity });
    return save(rows);
  }
  function update(id, colorId, quantity) {
    validate(id, colorId, quantity);
    const rows = read();
    const row = rows.find((row) => row.id === id && row.colorId === colorId);
    if (!row) throw new Error('Sản phẩm này không còn trong giỏ hàng.');
    row.quantity = quantity;
    return save(rows);
  }
  function remove(id, colorId) { return save(read().filter((row) => row.id !== id || row.colorId !== colorId)); }
  function summary() {
    const items = expand(read());
    return { items, quantity: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + item.total, 0) };
  }
  root.GocDeskCart = { key, maxQuantity, getItems: () => expand(read()), add, update, remove, summary,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
  if (typeof root.addEventListener === 'function') root.addEventListener('storage', (event) => { if (event.key === key || event.key === null) notify(); });
})(globalThis);
