const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// PUT /api/users/profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { password, role, ...data } = req.body; // prevent privilege escalation
    const user = await prisma.user.update({ where: { id: req.user.userId }, data, select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true } });
    res.json(user);
  } catch (err) { next(err); }
});

// GET /api/users
router.get('/', async (req, res, next) => {
  try {
    const { skip = 0, take = 10 } = req.query;
    const [users, total] = await Promise.all([
      prisma.user.findMany({ skip: parseInt(skip), take: parseInt(take), select: { id: true, email: true, name: true, role: true, createdAt: true } }),
      prisma.user.count(),
    ]);
    res.json({ users, total });
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) }, select: { id: true, email: true, name: true, role: true, createdAt: true } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

module.exports = router;
