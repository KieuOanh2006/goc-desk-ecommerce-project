const test = require('node:test');
const assert = require('node:assert/strict');
const { createProductModel } = require('../src/modules/products/product.model');

test('public product list filters and sorts by the active temporal sale price', async () => {
  let query;
  const database = {
    async execute(sql, params) {
      query = { sql, params };
      return [[{ id: 12, name: 'Desk lamp', slug: 'desk-lamp', price_from: '550000.00', image_url: null }]];
    },
  };

  const products = await createProductModel(database).listProducts('', '', 'price_asc', '', '', null, '600000', '');

  assert.match(query.sql, /sale_starts_at <= CURRENT_TIMESTAMP/);
  assert.match(query.sql, /sale_ends_at >= CURRENT_TIMESTAMP/);
  assert.match(query.sql, /MIN\(priced\.effective_price\)/);
  assert.match(query.sql, /priced\.effective_price <= CAST/);
  assert.match(query.sql, /pv\.price_from ASC/);
  assert.equal(query.params[4], '600000');
  assert.equal(products[0].priceFrom, '550000.00');
});

test('public product detail preserves base price and returns sale window and effective price', async () => {
  const database = {
    async execute() {
      return [[{
        product_id: '12', name: 'Desk lamp', slug: 'desk-lamp', short_description: null,
        description: null, specifications: null, brand_name: null, category_name: 'Lamps',
        variant_id: '21', sku: 'LAMP-BLK', color_name: 'Black', color_hex: '#000000',
        price: '680000.00', sale_price: '550000.00',
        sale_starts_at: '2026-11-24 00:00:00', sale_ends_at: null,
        effective_price: '550000.00', stock_quantity: 2, image_url: '/images/lamp.jpg',
      }]];
    },
  };

  const product = await createProductModel(database).getProductBySlug('desk-lamp');

  assert.equal(product.variants[0].price, '680000.00');
  assert.equal(product.variants[0].salePrice, '550000.00');
  assert.equal(product.variants[0].saleStartsAt, '2026-11-24 00:00:00');
  assert.equal(product.variants[0].saleEndsAt, null);
  assert.equal(product.variants[0].effectivePrice, '550000.00');
});

test('admin product detail returns hidden product and every variant with BIGINT string IDs', async () => {
  let query;
  const database = {
    async execute(sql, params) {
      query = { sql, params };
      return [[
        {
          id: '18446744073709551615', name: 'Hidden lamp', slug: 'hidden-lamp',
          shortDescription: null, description: null, specifications: null, status: 'hidden',
          variantId: '18446744073709551614', sku: 'LAMP-HIDDEN', colorName: 'Black',
          colorHex: '#000000', variantStatus: 'inactive', price: '680000.00', stockQuantity: 0,
        },
      ]];
    },
  };

  const product = await createProductModel(database).getAdminProductById('18446744073709551615');

  assert.match(query.sql, /LEFT JOIN product_variants/);
  assert.doesNotMatch(query.sql, /p\.status\s*=\s*'active'|v\.status\s*=\s*'active'/);
  assert.deepEqual(query.params, ['18446744073709551615']);
  assert.equal(product.id, '18446744073709551615');
  assert.equal(product.status, 'hidden');
  assert.equal(product.variants[0].id, '18446744073709551614');
  assert.equal(product.variants[0].status, 'inactive');
  assert.equal(product.variants[0].stockQuantity, 0);
});
