const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');
const emailService = require('../services/email.service');

router.use(authenticate);

router.get('/login-attempts', async (req, res, next) => {
  try {
    const attempts = await prisma.loginAttempt.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { user: true } });
    res.json(attempts);
  } catch (err) { next(err); }
});

router.get('/lockouts/:userId', async (req, res, next) => {
  try {
    const lockout = await prisma.accountLockout.findUnique({ where: { userId: parseInt(req.params.userId) } });
    res.json(lockout || {});
  } catch (err) { next(err); }
});

router.get('/lockout-status/:userId', async (req, res, next) => {
  try {
    const lockout = await prisma.accountLockout.findUnique({ where: { userId: parseInt(req.params.userId) } });
    const isLocked = lockout && lockout.lockedUntil > new Date();
    res.json({ locked: isLocked, lockedUntil: isLocked ? lockout.lockedUntil : null });
  } catch (err) { next(err); }
});

router.post('/unlock/:userId', async (req, res, next) => {
  try {
    await prisma.accountLockout.deleteMany({ where: { userId: parseInt(req.params.userId) } });
    res.json({ message: 'User unlocked' });
  } catch (err) { next(err); }
});

router.post('/lock/:userId', async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);
    const lockedUntil = new Date(Date.now() + 15 * 60000);
    await prisma.accountLockout.upsert({ where: { userId }, create: { userId, lockedUntil }, update: { lockedUntil } });
    res.json({ message: 'User locked', lockedUntil });
  } catch (err) { next(err); }
});

router.get('/check-block-status', async (req, res, next) => {
  try {
    const { identifier } = req.query;
    res.json({ blocked: false, identifier });
  } catch (err) { next(err); }
});

router.post('/cleanup', async (req, res, next) => {
  try {
    const cutoff = new Date(Date.now() - 90 * 86400000);
    const result = await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
    res.json({ deletedCount: result.count });
  } catch (err) { next(err); }
});

router.post('/send-alert/:userId', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.userId) } });
    if (!user || !user.email) return res.status(404).json({ message: 'User not found or no email' });
    await emailService.sendEmail(user.email, 'Security Alert', req.body.message || 'Security alert from admin.');
    res.json({ message: 'Alert sent' });
  } catch (err) { next(err); }
});

module.exports = router;
