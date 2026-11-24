const pool = require('../../config/database');

function createProductModel(database = pool) {
            async function listProducts(
    search = '', category = '', sort = '', brand = '', color = '',
    minPrice = null, maxPrice = null, useCase = ''
  ) {
    const sortOptions = new Map([
      ['price_asc', 'pv.price_from IS NULL, pv.price_from ASC, p.id ASC'],
      ['price_desc', 'pv.price_from IS NULL, pv.price_from DESC, p.id ASC'],
      ['name_asc', 'p.name ASC, p.id ASC'],
    ]);

    const orderBy = sortOptions.get(sort) || 'p.id DESC';
    const hasVariantFilter = color !== '' || minPrice !== null || maxPrice !== null;

    const [rows] = await database.execute(
      `SELECT p.id, p.name, p.slug, pv.price_from,
              (SELECT i.image_url
               FROM product_images AS i
               WHERE i.product_id = p.id AND i.variant_id IS NULL
               ORDER BY i.is_primary DESC, i.sort_order, i.id
               LIMIT 1) AS image_url
       FROM products AS p
       JOIN categories AS c ON c.id = p.category_id
       LEFT JOIN brands AS b ON b.id = p.brand_id
       LEFT JOIN (
         SELECT v.product_id, MIN(v.price) AS price_from
         FROM product_variants AS v
         WHERE v.status = 'active'
           AND (? = '' OR v.color_name = ?)
           AND (? IS NULL OR v.price >= CAST(? AS DECIMAL(12,2)))
           AND (? IS NULL OR v.price <= CAST(? AS DECIMAL(12,2)))
         GROUP BY v.product_id
       ) AS pv ON pv.product_id = p.id
       WHERE p.status = 'active'
         AND LOCATE(?, p.name) > 0
         AND (? = '' OR c.slug = ?)
         AND (? = '' OR b.slug = ?)
         AND (? = 0 OR pv.product_id IS NOT NULL)
                  AND (? = '' OR EXISTS (
           SELECT 1
           FROM product_use_cases AS pu
           JOIN use_cases AS u ON u.id = pu.use_case_id
           WHERE pu.product_id = p.id AND u.slug = ?
         ))
       ORDER BY ${orderBy}`,
      [
        color, color, minPrice, minPrice, maxPrice, maxPrice,
        search, category, category, brand, brand,
        hasVariantFilter ? 1 : 0,
                useCase, useCase,
      ]
    );

    return rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      priceFrom: row.price_from,
      imageUrl: row.image_url,
    }));
  }

  async function getProductBySlug(slug) {
    const [rows] = await database.execute(
      `SELECT p.id AS product_id, p.name, p.slug,
                    p.short_description, p.description, p.specifications,
              b.name AS brand_name, c.name AS category_name,
              v.id AS variant_id, v.sku, v.color_name, v.color_hex,
              v.price, v.stock_quantity,
              COALESCE(
                (SELECT i.image_url
                 FROM product_images AS i
                 WHERE i.product_id = p.id AND i.variant_id = v.id
                 ORDER BY i.is_primary DESC, i.sort_order, i.id
                 LIMIT 1),
                (SELECT i.image_url
                 FROM product_images AS i
                 WHERE i.product_id = p.id AND i.variant_id IS NULL
                 ORDER BY i.is_primary DESC, i.sort_order, i.id
                 LIMIT 1)
              ) AS image_url
       FROM products AS p
              JOIN categories AS c ON c.id = p.category_id
       LEFT JOIN brands AS b ON b.id = p.brand_id
       LEFT JOIN product_variants AS v
         ON v.product_id = p.id AND v.status = 'active'
       WHERE p.slug = ? AND p.status = 'active'
       ORDER BY v.id`,
      [slug]
    );

    if (rows.length === 0) return null;

    const product = rows[0];
    return {
      id: String(product.product_id),
      name: product.name,
      slug: product.slug,
            shortDescription: product.short_description,
      description: product.description,
      brandName: product.brand_name,
      categoryName: product.category_name,
      specifications: product.specifications,
      variants: rows
        .filter((row) => row.variant_id !== null)
        .map((row) => ({
          id: String(row.variant_id),
          sku: row.sku,
          colorName: row.color_name,
          colorHex: row.color_hex,
          imageUrl: row.image_url,
          price: row.price,
          stockQuantity: row.stock_quantity,
        })),
    };
  }

  return { listProducts, getProductBySlug };
}

module.exports = { createProductModel };