const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const usersService = require('../services/users.service');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const router = Router();

router.get('/profile', authenticate, async (req, res, next) => {
  try { res.json(await usersService.findById(req.user.userId)); } catch (e) { next(e); }
});

router.put('/profile', authenticate, async (req, res, next) => {
  try { res.json(await usersService.updateProfile(req.user.userId, req.body)); } catch (e) { next(e); }
});

// POST /api/users/change-password — authenticated user changes their own password
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.userId }, data: { passwordHash } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try { res.json(await usersService.findById(parseInt(req.params.id))); } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try { res.json(await usersService.getAllUsers(parseInt(req.query.skip) || 0, parseInt(req.query.take) || 10, req.query.search)); } catch (e) { next(e); }
});

module.exports = router;
