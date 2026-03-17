const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

// GET /api/admin/guiders
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

// GET /api/admin/guiders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const g = await prisma.languageGuider.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!g) return res.status(404).json({ message: 'Guider not found' });
    res.json(g);
  } catch (err) { next(err); }
});

// POST /api/admin/guiders
router.post('/', async (req, res, next) => {
  try {
    const g = await prisma.languageGuider.create({ data: req.body });
    res.status(201).json(g);
  } catch (err) { next(err); }
});

// PUT /api/admin/guiders/:id
router.put('/:id', async (req, res, next) => {
  try {
    const g = await prisma.languageGuider.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(g);
  } catch (err) { next(err); }
});

// DELETE /api/admin/guiders/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.languageGuider.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
