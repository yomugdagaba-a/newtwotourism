const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/language-guiders
router.get('/', async (req, res, next) => {
  try {
    const { skip = 0, take = 10 } = req.query;
    const [guiders, total] = await Promise.all([
      prisma.languageGuider.findMany({ skip: parseInt(skip), take: parseInt(take) }),
      prisma.languageGuider.count(),
    ]);
    res.json({ guiders, total });
  } catch (err) { next(err); }
});

// GET /api/language-guiders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const g = await prisma.languageGuider.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!g) return res.status(404).json({ message: 'Guider not found' });
    res.json(g);
  } catch (err) { next(err); }
});

// POST /api/language-guiders
router.post('/', authenticate, async (req, res, next) => {
  try {
    const g = await prisma.languageGuider.create({ data: req.body });
    res.status(201).json(g);
  } catch (err) { next(err); }
});

// PUT /api/language-guiders/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const g = await prisma.languageGuider.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(g);
  } catch (err) { next(err); }
});

// DELETE /api/language-guiders/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.languageGuider.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Guider deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
