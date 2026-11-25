START TRANSACTION;

INSERT INTO categories (name, slug)
SELECT 'Chuột máy tính', 'mouse'
WHERE NOT EXISTS (
    SELECT 1 FROM categories WHERE slug = 'mouse'
);

INSERT INTO brands (name, slug)
SELECT 'HyperWork', 'hyperwork'
WHERE NOT EXISTS (
    SELECT 1 FROM brands WHERE slug = 'hyperwork'
);

INSERT INTO products (
    category_id, brand_id, name, slug, short_description, status
)
SELECT c.id, b.id, 'Silentium Gen 2', 'silentium-gen-2',
       'Lướt êm, làm việc tập trung', 'active'
FROM categories AS c
JOIN brands AS b ON b.slug = 'hyperwork'
WHERE c.slug = 'mouse'
  AND NOT EXISTS (
      SELECT 1 FROM products WHERE slug = 'silentium-gen-2'
  );

INSERT INTO product_variants (product_id, sku, color_name, color_hex, price)
SELECT p.id, 'SILENTIUM-G2-BLACK', 'Đen', '#28292b', 649000
FROM products AS p
WHERE p.slug = 'silentium-gen-2'
  AND NOT EXISTS (
      SELECT 1 FROM product_variants WHERE sku = 'SILENTIUM-G2-BLACK'
  );

INSERT INTO product_images (product_id, variant_id, image_url, is_primary)
SELECT p.id, NULL, 'images/product-pages/silentium-gen-2.jpg', TRUE
FROM products AS p
WHERE p.slug = 'silentium-gen-2'
  AND NOT EXISTS (
      SELECT 1 FROM product_images AS i
      WHERE i.product_id = p.id
        AND i.variant_id IS NULL
        AND i.image_url = 'images/product-pages/silentium-gen-2.jpg'
  );

COMMIT;