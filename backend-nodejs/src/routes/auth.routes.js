const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticate, getClientIp } = require('../middleware/auth.middleware');
const emailService = require('../services/email.service');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';
const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_FAILED_ATTEMPTS || '5');
const LOCKOUT_DURATION_MINUTES = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15');
const OTP_EXPIRY_MINUTES = 15;
const COOLDOWN_SECONDS = 60;

function parseExpiry(exp) {
  const m = String(exp).match(/^(\d+)([smhd])$/);
  if (!m) return 900;
  const v = parseInt(m[1]);
  switch (m[2]) {
    case 's': return v;
    case 'm': return v * 60;
    case 'h': return v * 3600;
    case 'd': return v * 86400;
    default: return 900;
  }
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function generateTokens(user) {
  const roles = user.roles.map(r => `ROLE_${r.name}`);
  const payload = { sub: user.username, userId: user.id, roles };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
  const refreshPayload = { ...payload, jti: `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
  const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 86400000) },
  });

  const expiresIn = parseExpiry(JWT_EXPIRATION);
  return {
    token: accessToken, accessToken, refreshToken,
    expiresIn, expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    userId: user.id,
    user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName, roles: user.roles.map(r => r.name) },
  };
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body;
    const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existing) return res.status(400).json({ message: 'Username or email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash, fullName, roles: { connect: { name: 'CLIENT' } } },
      include: { roles: true },
    });

    // Send verification email
    try {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);
      await prisma.emailVerificationToken.create({
        data: { userId: user.id, token: otp, email, expiresAt, ipAddress: getClientIp(req), userAgent: req.get('user-agent') || '' },
      });
      await emailService.sendEmailVerificationOtp(email, otp, OTP_EXPIRY_MINUTES);
    } catch (e) { console.error('Verification email failed:', e.message); }

    res.json(await generateTokens(user));
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const ip = getClientIp(req);
    const ua = req.get('user-agent') || '';

    const user = await prisma.user.findUnique({ where: { username }, include: { roles: true } });

    // Check lockout
    if (user) {
      const lockout = await prisma.accountLockout.findUnique({ where: { userId: user.id } });
      if (lockout && lockout.lockedUntil > new Date()) {
        await prisma.loginAttempt.create({ data: { userId: user.id, ipAddress: ip, success: false, reason: 'Account locked' } });
        return res.status(401).json({ message: 'Account is temporarily locked. Please try again later.' });
      }
    }

    if (!user) {
      await prisma.loginAttempt.create({ data: { ipAddress: ip, success: false, reason: 'User not found' } });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await prisma.loginAttempt.create({ data: { userId: user.id, ipAddress: ip, success: false, reason: 'Invalid password' } });
      // Check if should lock
      const oneHourAgo = new Date(Date.now() - 3600000);
      const failures = await prisma.loginAttempt.count({ where: { userId: user.id, success: false, createdAt: { gte: oneHourAgo } } });
      if (failures >= MAX_FAILED_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000);
        await prisma.accountLockout.upsert({ where: { userId: user.id }, create: { userId: user.id, lockedUntil }, update: { lockedUntil } });
        try {
          if (user.email) await emailService.sendEmail(user.email, 'Security Alert - Account Locked', emailService.buildSecurityAlertMessage('ACCOUNT_LOCKED', ip, LOCKOUT_DURATION_MINUTES));
        } catch (e) {}
      }
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.active) {
      await prisma.loginAttempt.create({ data: { userId: user.id, ipAddress: ip, success: false, reason: 'Inactive account' } });
      return res.status(401).json({ message: 'User account is inactive' });
    }

    await prisma.loginAttempt.create({ data: { userId: user.id, ipAddress: ip, success: true } });
    res.json(await generateTokens(user));
  } catch (err) { next(err); }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { roles: true } });
    if (!user) return res.status(401).json({ message: 'User not found' });
    res.json(await generateTokens(user));
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.userId } });
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const ip = getClientIp(req);
    const ua = req.get('user-agent') || '';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ success: true, message: 'If the email exists, a 6-digit OTP has been sent.' });
    if (!user.active) return res.status(400).json({ success: false, message: 'Account is inactive.' });

    const lastToken = await prisma.passwordResetToken.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    if (lastToken) {
      const secs = Math.floor((Date.now() - lastToken.createdAt.getTime()) / 1000);
      if (secs < COOLDOWN_SECONDS) return res.status(400).json({ success: false, message: `Please wait ${COOLDOWN_SECONDS - secs} seconds.` });
    }

    await prisma.passwordResetToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60000);
    await prisma.passwordResetToken.create({ data: { userId: user.id, token: otp, expiresAt, ipAddress: ip, userAgent: ua } });
    await emailService.sendPasswordResetOtp(email, otp, 10);
    res.json({ success: true, message: 'A 6-digit OTP has been sent to your email. It expires in 10 minutes.', expiresInMinutes: 10 });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password/confirm
router.post('/reset-password/confirm', async (req, res, next) => {
  try {
    const { token, newPassword, email } = req.body;
    if (!/^\d{6}$/.test(token)) return res.status(400).json({ success: false, message: 'Invalid OTP format.' });
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token }, include: { user: true } });
    if (!resetToken) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    if (email && resetToken.user.email !== email.toLowerCase().trim()) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    if (resetToken.used || resetToken.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'OTP has expired.' });
    if (resetToken.attemptCount >= 3) {
      await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } });
      return res.status(400).json({ success: false, message: 'Too many failed attempts.' });
    }
    await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { attemptCount: resetToken.attemptCount + 1 } });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
    await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } });
    res.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (err) { next(err); }
});

// GET /api/auth/reset-password/validate
router.get('/reset-password/validate', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!/^\d{6}$/.test(token)) return res.json({ success: false, message: 'Invalid or expired token' });
    const t = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!t || t.used || t.expiresAt < new Date()) return res.json({ success: false, message: 'Invalid or expired token' });
    res.json({ success: true, message: 'Token is valid' });
  } catch (err) { next(err); }
});

// POST /api/auth/send-verification
router.post('/send-verification', async (req, res, next) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const ip = getClientIp(req);
    const ua = req.get('user-agent') || '';
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ success: false, message: 'Email address not found.' });
    if (!user.active) return res.status(400).json({ success: false, message: 'Account is inactive.' });
    if (user.emailVerified) return res.json({ success: true, message: 'Email is already verified.' });

    const lastToken = await prisma.emailVerificationToken.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } });
    if (lastToken) {
      const secs = Math.floor((Date.now() - lastToken.createdAt.getTime()) / 1000);
      if (secs < COOLDOWN_SECONDS) return res.status(400).json({ success: false, message: `Please wait ${COOLDOWN_SECONDS - secs} seconds.` });
    }

    await prisma.emailVerificationToken.updateMany({ where: { email, verified: false }, data: { verified: true } });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);
    await prisma.emailVerificationToken.create({ data: { userId: user.id, token: otp, email, expiresAt, ipAddress: ip, userAgent: ua } });
    await emailService.sendEmailVerificationOtp(email, otp, OTP_EXPIRY_MINUTES);
    res.json({ success: true, message: `OTP sent. Expires in ${OTP_EXPIRY_MINUTES} minutes.`, expiresInMinutes: OTP_EXPIRY_MINUTES });
  } catch (err) { next(err); }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!/^\d{6}$/.test(token)) return res.status(400).json({ success: false, message: 'Invalid OTP format.' });
    const vt = await prisma.emailVerificationToken.findUnique({ where: { token }, include: { user: true } });
    if (!vt || vt.verified || vt.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    if (vt.attemptCount >= 3) {
      await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { verified: true } });
      return res.status(400).json({ success: false, message: 'Too many failed attempts.' });
    }
    await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { attemptCount: vt.attemptCount + 1 } });
    await prisma.user.update({ where: { id: vt.userId }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
    await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { verified: true } });
    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (err) { next(err); }
});

// POST /api/auth/verify-email-otp
router.post('/verify-email-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.query;
    if (!/^\d{6}$/.test(otp)) return res.status(400).json({ success: false, message: 'Invalid OTP format.' });
    const normalizedEmail = email?.toLowerCase().trim();
    const vt = await prisma.emailVerificationToken.findFirst({ where: { token: otp, email: normalizedEmail }, include: { user: true } });
    if (!vt || vt.verified || vt.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    if (vt.attemptCount >= 3) {
      await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { verified: true } });
      return res.status(400).json({ success: false, message: 'Too many failed attempts.' });
    }
    await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { attemptCount: vt.attemptCount + 1 } });
    await prisma.user.update({ where: { id: vt.userId }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
    await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { verified: true } });
    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (err) { next(err); }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { userId } = req.query;
    const ip = getClientIp(req);
    const ua = req.get('user-agent') || '';
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return res.status(400).json({ success: false, message: 'User not found.' });
    if (user.emailVerified) return res.json({ success: true, message: 'Email is already verified.' });
    const email = user.email;
    await prisma.emailVerificationToken.updateMany({ where: { email, verified: false }, data: { verified: true } });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);
    await prisma.emailVerificationToken.create({ data: { userId: user.id, token: otp, email, expiresAt, ipAddress: ip, userAgent: ua } });
    await emailService.sendEmailVerificationOtp(email, otp, OTP_EXPIRY_MINUTES);
    res.json({ success: true, message: `OTP resent. Expires in ${OTP_EXPIRY_MINUTES} minutes.` });
  } catch (err) { next(err); }
});

// GET /api/auth/verify-email/validate
router.get('/verify-email/validate', async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!/^\d{6}$/.test(token)) return res.json({ success: false, message: 'Invalid or expired OTP' });
    const t = await prisma.emailVerificationToken.findUnique({ where: { token } });
    if (!t || t.verified || t.expiresAt < new Date()) return res.json({ success: false, message: 'Invalid or expired OTP' });
    res.json({ success: true, message: 'OTP is valid' });
  } catch (err) { next(err); }
});

// GET /api/auth/email-verified
router.get('/email-verified', async (req, res, next) => {
  try {
    const { email } = req.query;
    const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase().trim() } });
    if (user?.emailVerified) return res.json({ success: true, message: 'Email is verified' });
    res.json({ success: false, message: 'Email is not verified' });
  } catch (err) { next(err); }
});

module.exports = router;
