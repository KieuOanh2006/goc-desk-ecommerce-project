const { createApiError } = require('../../middlewares/error-handler');
const { createProductModel } = require('./product.model');

function createProductService(model = createProductModel()) {
  async function getAdminProductById(productId) {
    const product = await model.getAdminProductById(productId);
    if (!product) {
      throw createApiError(404, 'PRODUCT_NOT_FOUND', 'Không tìm thấy sản phẩm.');
    }
    return product;
  }

  return { getAdminProductById };
}

module.exports = { createProductService };
