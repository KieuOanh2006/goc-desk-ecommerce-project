const express = require('express');
const healthRoutes = require('./health');
const authRoutes = require('../modules/auth/auth.routes');
const adminRoutes = require('../modules/admin/staff.routes');
const userRoutes = require('../modules/users/user.routes');
const loyaltyRoutes = require('../modules/loyalty/loyalty.routes');

const router = express.Router();
router.use('/products', require('../modules/products/product.routes'));
router.use('/health', healthRoutes);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin/categories', require('../modules/products/category-admin.routes'));
router.use('/admin/products', require('../modules/products/product-admin.routes'));
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/loyalty', loyaltyRoutes);

module.exports = router;
