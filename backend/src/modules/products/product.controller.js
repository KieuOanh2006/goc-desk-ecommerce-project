const { createProductService } = require('./product.service');

function createProductController(service = createProductService()) {
  async function getAdminProduct(req, res, next) {
    try {
      const data = await service.getAdminProductById(req.validated.params.productId);
      return res.json({ success: true, message: 'Lấy thông tin sản phẩm thành công.', data });
    } catch (error) {
      return next(error);
    }
  }

  return { getAdminProduct };
}

module.exports = { createProductController };
