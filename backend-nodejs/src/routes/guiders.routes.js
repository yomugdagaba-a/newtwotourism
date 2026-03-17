const router = require('express').Router();
const prisma = require('../lib/prisma');

// GET /api/guiders/tourism/:tourismPlaceId
router.get('/tourism/:tourismPlaceId', async (req, res, next) => {
  try {
    const guiders = await prisma.languageGuider.findMany({ where: { active: true } });
    res.json(guiders);
  } catch (err) { next(err); }
});

// GET /api/guiders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const g = await prisma.languageGuider.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!g) return res.status(404).json({ message: 'Guider not found' });
    res.json(g);
  } catch (err) { next(err); }
});

module.exports = router;
