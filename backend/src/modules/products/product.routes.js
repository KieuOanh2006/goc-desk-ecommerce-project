const express = require('express');
const { createProductModel } = require('./product.model');

const router = express.Router();
const productModel = createProductModel();

router.get('/', async (req, res, next) => {
  try {
    const { query } = req;
    const text = (value) => typeof value === 'string' ? value.trim() : '';
    const { minPrice, maxPrice } = query;

    // Giá nhận dạng 650000 hoặc 650000.50.
    const validPrice = (value) =>
      value === undefined ||
      (typeof value === 'string' && /^\d{1,10}(\.\d{1,2})?$/.test(value));

    if (!validPrice(minPrice) || !validPrice(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Giá phải là số không âm, ví dụ 650000.',
        error: { code: 'INVALID_PRICE' },
      });
    }

    if (minPrice !== undefined && maxPrice !== undefined &&
        Number(minPrice) > Number(maxPrice)) {
      return res.status(400).json({
        success: false,
        message: 'Giá thấp nhất phải nhỏ hơn hoặc bằng giá cao nhất.',
        error: { code: 'INVALID_PRICE_RANGE' },
      });
    }

    const products = await productModel.listProducts(
      text(query.search),
      text(query.category),
      text(query.sort),
      text(query.brand),
      text(query.color),
      minPrice ?? null,
      maxPrice ?? null,
      text(query.useCase)
    );

    return res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});



router.get('/:slug', async (req, res, next) => {
  try {
    const product = await productModel.getProductBySlug(req.params.slug);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm.',
        error: { code: 'PRODUCT_NOT_FOUND' },
      });
    }

    return res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

module.exports = router;