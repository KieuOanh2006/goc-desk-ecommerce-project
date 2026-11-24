const express = require('express');
const { z } = require('zod');
const pool = require('../../config/database');
const validate = require('../../middlewares/validate');
const { requireAuthSession } = require('../../middlewares/auth-session');
const { authorizeRoles } = require('../../middlewares/authorization');
const requireTrustedOrigin = require('../../middlewares/require-trusted-origin');
const { createApiError } = require('../../middlewares/error-handler');

const router = express.Router();

const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug phải có dạng den-ban.'),
}).strict();

router.post(
  '/',
  requireAuthSession,
  authorizeRoles('admin', 'product_content_staff'),
  requireTrustedOrigin,
  validate({ body: createCategorySchema }),
  async (req, res, next) => {
    const name = req.body.name.trim();
    const slug = req.body.slug.trim();

    try {
      const [result] = await pool.execute(
        'INSERT INTO categories (name, slug) VALUES (?, ?)',
        [name, slug]
      );

      return res.status(201).json({
        success: true,
        data: { id: String(result.insertId), name, slug },
      });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return next(createApiError(
          409,
          'CATEGORY_SLUG_EXISTS',
          'Slug danh mục đã tồn tại.'
        ));
      }
      return next(error);
    }
  }
);

module.exports = router;