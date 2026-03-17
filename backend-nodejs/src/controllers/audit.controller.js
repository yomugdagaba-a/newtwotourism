const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const auditService = require('../services/audit.service');

const router = Router();

// GET /api/audit — authenticated, not admin-only
router.get('/', authenticate, async (req, res, next) => {
  try {
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;
    const take = req.query.take ? parseInt(req.query.take) : 10;
    const userId = req.query.userId ? parseInt(req.query.userId) : undefined;
    const action = req.query.action;
    res.json(await auditService.findAll(skip, take, userId, action));
  } catch (e) { next(e); }
});

// GET /api/audit/statistics — authenticated, not admin-only
router.get('/statistics', authenticate, async (req, res, next) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    res.json(await auditService.getStatistics(days));
  } catch (e) { next(e); }
});

module.exports = router;
