const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.post('/', async (req, res, next) => {
  try {
    const g = await prisma.languageGuider.create({ data: req.body });
    res.status(201).json(g);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const g = await prisma.languageGuider.update({ where: { id: parseInt(req.params.id) }, data: req.body });
    res.json(g);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.languageGuider.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
