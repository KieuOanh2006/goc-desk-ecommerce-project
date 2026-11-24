const express = require('express');
const { z } = require('zod');
const pool = require('../../config/database');
const validate = require('../../middlewares/validate');
const { requireAuthSession } = require('../../middlewares/auth-session');
const { authorizeRoles } = require('../../middlewares/authorization');
const requireTrustedOrigin = require('../../middlewares/require-trusted-origin');
const { createApiError } = require('../../middlewares/error-handler');

const router = express.Router();

const slugSchema = z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const variantSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  colorName: z.string().trim().min(1).max(60),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  price: z.number().int().min(0).max(9999999999),
  stockQuantity: z.number().int().min(0).max(4294967295),
}).strict();

const createProductSchema = z.object({
  name: z.string().trim().min(1).max(180),
  slug: slugSchema.max(200),
  categorySlug: slugSchema.max(120),
  shortDescription: z.string().trim().max(500).optional(),
  variants: z.array(variantSchema).min(1),
}).strict();

router.post(
  '/',
  requireAuthSession,
  authorizeRoles('admin', 'product_content_staff'),
  requireTrustedOrigin,
  validate({ body: createProductSchema }),
  async (req, res, next) => {
    let connection;
    let transactionStarted = false;

    try {
      const { name, slug, categorySlug, shortDescription, variants } = req.body;
      connection = await pool.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [categories] = await connection.execute(
        'SELECT id FROM categories WHERE slug = ?',
        [categorySlug.trim()]
      );

      if (categories.length === 0) {
        throw createApiError(400, 'CATEGORY_NOT_FOUND', 'Danh mục không tồn tại.');
      }

      const [product] = await connection.execute(
        `INSERT INTO products (category_id, name, slug, short_description, status)
         VALUES (?, ?, ?, ?, 'active')`,
        [categories[0].id, name.trim(), slug.trim(), shortDescription?.trim() ?? null]
      );

      for (const variant of variants) {
        await connection.execute(
          `INSERT INTO product_variants
             (product_id, sku, color_name, color_hex, price, stock_quantity)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            product.insertId,
            variant.sku.trim(),
            variant.colorName.trim(),
            variant.colorHex ?? null,
            variant.price,
            variant.stockQuantity,
          ]
        );
      }

      await connection.commit();
      transactionStarted = false;

      return res.status(201).json({
        success: true,
        data: { id: String(product.insertId), slug: slug.trim() },
      });
    } catch (error) {
      if (transactionStarted) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          return next(rollbackError);
        }
      }

      if (error.code === 'ER_DUP_ENTRY') {
        return next(createApiError(409, 'PRODUCT_CONFLICT', 'Slug sản phẩm hoặc SKU đã tồn tại.'));
      }

      return next(error);
    } finally {
      if (connection) connection.release();
    }
  }
);
const updateVariantSchema = z.object({
  price: z.number().int().min(0).max(9999999999).optional(),
  stockQuantity: z.number().int().min(0).max(4294967295).optional(),
}).strict().refine(
  (body) => body.price !== undefined || body.stockQuantity !== undefined,
  'Cần nhập giá hoặc số lượng tồn kho.'
);

router.patch(
  '/:productId/variants/:variantId',
  requireAuthSession,
  authorizeRoles('admin', 'product_content_staff'),
  requireTrustedOrigin,
  validate({ body: updateVariantSchema }),
  async (req, res, next) => {
    const { productId, variantId } = req.params;
    const { price, stockQuantity } = req.body;
    const validId = /^[1-9]\d{0,19}$/;

    if (!validId.test(productId) || !validId.test(variantId)) {
      return next(createApiError(400, 'INVALID_ID', 'Mã sản phẩm hoặc biến thể không hợp lệ.'));
    }

    try {
      const [result] = await pool.execute(
        `UPDATE product_variants
         SET price = COALESCE(?, price),
             stock_quantity = COALESCE(?, stock_quantity)
         WHERE id = ? AND product_id = ?`,
        [price ?? null, stockQuantity ?? null, variantId, productId]
      );

      if (result.affectedRows === 0) {
        const [rows] = await pool.execute(
          'SELECT id FROM product_variants WHERE id = ? AND product_id = ?',
          [variantId, productId]
        );

        if (rows.length === 0) {
          return next(createApiError(404, 'VARIANT_NOT_FOUND', 'Không tìm thấy biến thể của sản phẩm này.'));
        }
      }

      return res.json({ success: true, message: 'Đã cập nhật biến thể.' });
    } catch (error) {
      next(error);
    }
  }
);
const productStatusSchema = z.object({
  status: z.enum(['active', 'hidden']),
}).strict();

router.patch(
  '/:productId/status',
  requireAuthSession,
  authorizeRoles('admin', 'product_content_staff'),
  requireTrustedOrigin,
  validate({ body: productStatusSchema }),
  async (req, res, next) => {
    const { productId } = req.params;
    const { status } = req.body;

    if (!/^[1-9]\d{0,19}$/.test(productId)) {
      return next(createApiError(400, 'INVALID_ID', 'Mã sản phẩm không hợp lệ.'));
    }

    try {
      const [result] = await pool.execute(
        'UPDATE products SET status = ? WHERE id = ?',
        [status, productId]
      );

      if (result.affectedRows === 0) {
        const [rows] = await pool.execute(
          'SELECT id FROM products WHERE id = ?',
          [productId]
        );

        if (rows.length === 0) {
          return next(createApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.'));
        }
      }

      return res.json({ success: true, data: { id: productId, status } });
    } catch (error) {
      next(error);
    }
  }
);
router.get(
  '/',
  requireAuthSession,
  authorizeRoles('admin', 'product_content_staff'),
  async (req, res, next) => {
    try {
      const [products] = await pool.execute(`
        SELECT CAST(p.id AS CHAR) AS id,
               p.name,
               p.slug,
               p.status,
               c.name AS categoryName
        FROM products AS p
        JOIN categories AS c ON c.id = p.category_id
        ORDER BY p.id DESC
      `);

      return res.json({ success: true, data: products });
    } catch (error) {
      return next(error);
    }
  }
);
router.patch(
  '/:productId',
  requireAuthSession,
  authorizeRoles('admin', 'product_content_staff'),
  requireTrustedOrigin,
  validate({
    params: z.object({
      productId: z.string().regex(/^[1-9][0-9]{0,19}$/),
    }),
    body: z.object({
      name: z.string().trim().min(1).max(180).optional(),
      shortDescription: z.string().trim().max(500).optional(),
      description: z.string().trim().max(16000).optional(),
    }).strict().refine((body) => Object.keys(body).length > 0, {
      message: 'Cần gửi ít nhất một thông tin muốn sửa.',
    }),
  }),
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { name, shortDescription, description } = req.body;

      const [result] = await pool.execute(
        `UPDATE products
         SET name = COALESCE(?, name),
             short_description = COALESCE(?, short_description),
             description = COALESCE(?, description)
         WHERE id = ?`,
        [name ?? null, shortDescription ?? null, description ?? null, productId],
      );

      if (result.affectedRows === 0) {
        const [rows] = await pool.execute(
          'SELECT id FROM products WHERE id = ?',
          [productId],
        );
        if (rows.length === 0) {
          return next(createApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.'));
        }
      }

      return res.json({ success: true, data: { id: productId } });
    } catch (error) {
      return next(error);
    }
  }
);
router.patch(
  '/:productId/classification',
  requireAuthSession,
  authorizeRoles('admin', 'product_content_staff'),
  requireTrustedOrigin,
  validate({
    params: z.object({
      productId: z.string().regex(/^[1-9][0-9]{0,19}$/),
    }),
    body: z.object({
      categorySlug: z.string().trim().min(1).max(120).optional(),
      brandSlug: z.string().trim().min(1).max(120).nullable().optional(),
      useCaseSlugs: z.array(
        z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120)
      ).max(50).optional(),
    }).strict().refine((body) => Object.keys(body).length > 0, {
      message: 'Cần chọn ít nhất một thông tin muốn cập nhật.',
    }),
  }),
  async (req, res, next) => {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const { productId } = req.params;
      const { categorySlug, brandSlug, useCaseSlugs } = req.body;
      const [products] = await connection.execute(
        'SELECT id FROM products WHERE id = ? FOR UPDATE',
        [productId],
      );
      if (!products.length) {
        throw createApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
      }

      if (categorySlug !== undefined) {
        const [categories] = await connection.execute(
          'SELECT id FROM categories WHERE slug = ?',
          [categorySlug],
        );
        if (!categories.length) {
          throw createApiError(422, 'CATEGORY_NOT_FOUND', 'Danh mục đã chọn chưa tồn tại.');
        }
        await connection.execute(
          'UPDATE products SET category_id = ? WHERE id = ?',
          [categories[0].id, productId],
        );
      }

      if (brandSlug !== undefined) {
        let brandId = null;
        if (brandSlug !== null) {
          const [brands] = await connection.execute(
            'SELECT id FROM brands WHERE slug = ?',
            [brandSlug],
          );
          if (!brands.length) {
            throw createApiError(422, 'BRAND_NOT_FOUND', 'Thương hiệu đã chọn chưa tồn tại.');
          }
          brandId = brands[0].id;
        }
        await connection.execute(
          'UPDATE products SET brand_id = ? WHERE id = ?',
          [brandId, productId],
        );
      }

      if (useCaseSlugs !== undefined) {
        const slugs = [...new Set(useCaseSlugs)];
        let useCases = [];
        if (slugs.length) {
          const placeholders = slugs.map(() => '?').join(', ');
          [useCases] = await connection.execute(
            `SELECT id FROM use_cases WHERE slug IN (${placeholders})`,
            slugs,
          );
          if (useCases.length !== slugs.length) {
            throw createApiError(422, 'USE_CASE_NOT_FOUND', 'Có nhu cầu sử dụng chưa tồn tại.');
          }
        }

        await connection.execute(
          'DELETE FROM product_use_cases WHERE product_id = ?',
          [productId],
        );
        for (const useCase of useCases) {
          await connection.execute(
            'INSERT INTO product_use_cases (product_id, use_case_id) VALUES (?, ?)',
            [productId, useCase.id],
          );
        }
      }

      await connection.commit();
      return res.json({ success: true, data: { id: productId } });
    } catch (error) {
      if (connection) await connection.rollback();
      return next(error);
    } finally {
      if (connection) connection.release();
    }
  }
);
router.patch(
  '/:productId/specifications',
  requireAuthSession,
  authorizeRoles('admin', 'product_content_staff'),
  requireTrustedOrigin,
  validate({
    params: z.object({
      productId: z.string().regex(/^[1-9][0-9]{0,19}$/),
    }),
    body: z.object({
      specifications: z.array(
        z.tuple([
          z.string().trim().min(1).max(120),
          z.string().trim().min(1).max(500),
        ]),
      ).max(100),
    }).strict(),
  }),
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { specifications } = req.body;

      const [result] = await pool.execute(
        'UPDATE products SET specifications = ? WHERE id = ?',
        [JSON.stringify(specifications), productId],
      );

      if (result.affectedRows === 0) {
        const [rows] = await pool.execute(
          'SELECT id FROM products WHERE id = ?',
          [productId],
        );
        if (!rows.length) {
          return next(createApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.'));
        }
      }

      return res.json({ success: true, data: { id: productId, specifications } });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:productId/variants',
  requireAuthSession,
  authorizeRoles('admin', 'product_content_staff'),
  requireTrustedOrigin,
  validate({
    params: z.object({
      productId: z.string().regex(/^[1-9][0-9]{0,19}$/),
    }),
    body: z.object({
      sku: z.string().trim().min(1).max(80),
      colorName: z.string().trim().min(1).max(60),
      colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
      price: z.number().int().min(0).max(9999999999),
      stockQuantity: z.number().int().min(0).max(4294967295),
    }).strict(),
  }),
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { sku, colorName, colorHex, price, stockQuantity } = req.body;

      const [result] = await pool.execute(
        `INSERT INTO product_variants
           (product_id, sku, color_name, color_hex, price, stock_quantity, status)
         SELECT id, ?, ?, ?, ?, ?, 'active'
         FROM products
         WHERE id = ?`,
        [sku, colorName, colorHex ?? null, price, stockQuantity, productId],
      );

      if (result.affectedRows === 0) {
        return next(createApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.'));
      }

      return res.status(201).json({
        success: true,
        data: { id: String(result.insertId), productId, sku },
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return next(createApiError(409, 'SKU_ALREADY_EXISTS', 'Mã SKU này đã được sử dụng.'));
      }
      return next(error);
    }
  }
);
router.put(
  '/:productId/image',
  requireAuthSession,
  authorizeRoles('admin', 'product_content_staff'),
  requireTrustedOrigin,
  validate({
    params: z.object({
      productId: z.string().regex(/^[1-9][0-9]{0,19}$/),
    }),
    body: z.object({
      variantId: z.string().regex(/^[1-9][0-9]{0,19}$/).optional(),
      imageUrl: z.string().trim().min(1).max(1000)
        .regex(/^(?:images\/|https:\/\/)\S+$/, 'Dùng đường dẫn images/... hoặc https://...'),
    }).strict(),
  }),
  async (req, res, next) => {
    const { productId } = req.params;
    const { variantId = null, imageUrl } = req.body;
    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [products] = await connection.execute(
        'SELECT id FROM products WHERE id = ? FOR UPDATE',
        [productId],
      );
      if (!products.length) {
        throw createApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
      }

      if (variantId !== null) {
        const [variants] = await connection.execute(
          'SELECT id FROM product_variants WHERE id = ? AND product_id = ?',
          [variantId, productId],
        );
        if (!variants.length) {
          throw createApiError(404, 'VARIANT_NOT_FOUND', 'Sản phẩm này không có biến thể đã chọn.');
        }
      }

      // variant_id bằng NULL là ảnh chung của sản phẩm.
      const [images] = await connection.execute(
        `SELECT id FROM product_images
         WHERE product_id = ? AND variant_id <=> ? AND is_primary = 1
         ORDER BY sort_order, id LIMIT 1`,
        [productId, variantId],
      );

      if (images.length) {
        await connection.execute(
          'UPDATE product_images SET image_url = ? WHERE id = ?',
          [imageUrl, images[0].id],
        );
      } else {
        await connection.execute(
          `INSERT INTO product_images
             (product_id, variant_id, image_url, sort_order, is_primary)
           VALUES (?, ?, ?, 0, 1)`,
          [productId, variantId, imageUrl],
        );
      }

      await connection.commit();
      return res.json({ success: true, data: { productId, variantId, imageUrl } });
    } catch (error) {
      if (connection) await connection.rollback();
      return next(error);
    } finally {
      if (connection) connection.release();
    }
  }
);
module.exports = router;