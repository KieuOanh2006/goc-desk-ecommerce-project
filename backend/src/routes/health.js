const express = require('express');
const pool = require('../config/database');
const { createApiError } = require('../middlewares/error-handler');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Backend đang hoạt động.',
    data: { status: 'ok', timestamp: new Date().toISOString() },
  });
});

router.get('/db', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    return res.json({
      success: true,
      message: 'Kết nối cơ sở dữ liệu hoạt động.',
      data: { status: 'ok', timestamp: new Date().toISOString() },
    });
  } catch {
    return next(createApiError(503, 'DATABASE_UNAVAILABLE', 'Không thể kết nối cơ sở dữ liệu.'));
  }
});

module.exports = router;
