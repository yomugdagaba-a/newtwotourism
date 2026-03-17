const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const emailService = require('./email.service');

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
  const map = { s: 1, m: 60, h: 3600, d: 86400 };
  return v * (map[m[2]] || 1);
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

async function register({ username, email, password, fullName }) {
  const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) throw Object.assign(new Error('Username or email already exists'), { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, passwordHash, fullName, roles: { connect: { name: 'CLIENT' } } },
    include: { roles: true },
  });

  try {
    const otp = generateOtp();
    await prisma.emailVerificationToken.create({
      data: { userId: user.id, token: otp, email, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000) },
    });
    await emailService.sendEmailVerificationOtp(email, otp, OTP_EXPIRY_MINUTES);
  } catch (e) { console.error('Verification email failed:', e.message); }

  return generateTokens(user);
}

async function login({ username, password }, ip = 'unknown', ua = 'unknown') {
  const user = await prisma.user.findUnique({ where: { username }, include: { roles: true } });

  if (user) {
    const lockout = await prisma.accountLockout.findUnique({ where: { userId: user.id } });
    if (lockout && lockout.lockedUntil > new Date()) {
      await prisma.loginAttempt.create({ data: { userId: user.id, ipAddress: ip, success: false, reason: 'Account locked' } });
      throw Object.assign(new Error('Account is temporarily locked. Please try again later.'), { status: 401 });
    }
  }

  if (!user) {
    await prisma.loginAttempt.create({ data: { ipAddress: ip, success: false, reason: 'User not found' } });
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    await prisma.loginAttempt.create({ data: { userId: user.id, ipAddress: ip, success: false, reason: 'Invalid password' } });
    const oneHourAgo = new Date(Date.now() - 3600000);
    const failures = await prisma.loginAttempt.count({ where: { userId: user.id, success: false, createdAt: { gte: oneHourAgo } } });
    if (failures >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000);
      await prisma.accountLockout.upsert({ where: { userId: user.id }, create: { userId: user.id, lockedUntil }, update: { lockedUntil } });
      try { if (user.email) await emailService.sendEmail(user.email, 'Security Alert - Account Locked', `Your account has been locked for ${LOCKOUT_DURATION_MINUTES} minutes due to multiple failed login attempts.`); } catch (e) {}
    }
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  if (!user.active) {
    await prisma.loginAttempt.create({ data: { userId: user.id, ipAddress: ip, success: false, reason: 'Inactive account' } });
    throw Object.assign(new Error('User account is inactive'), { status: 401 });
  }

  await prisma.loginAttempt.create({ data: { userId: user.id, ipAddress: ip, success: true } });
  return generateTokens(user);
}

async function refreshToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, include: { roles: true } });
    if (!user) throw Object.assign(new Error('User not found'), { status: 401 });
    return generateTokens(user);
  } catch (e) {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }
}

async function logout(userId) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

async function initiatePasswordReset(email, ip, ua) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return { success: true, message: 'If the email exists, a 6-digit OTP has been sent.' };
  if (!user.active) throw Object.assign(new Error('Account is inactive.'), { status: 400 });

  const lastToken = await prisma.passwordResetToken.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  if (lastToken) {
    const secs = Math.floor((Date.now() - lastToken.createdAt.getTime()) / 1000);
    if (secs < COOLDOWN_SECONDS) throw Object.assign(new Error(`Please wait ${COOLDOWN_SECONDS - secs} seconds.`), { status: 400 });
  }

  await prisma.passwordResetToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
  const otp = generateOtp();
  await prisma.passwordResetToken.create({ data: { userId: user.id, token: otp, expiresAt: new Date(Date.now() + 10 * 60000), ipAddress: ip, userAgent: ua } });
  await emailService.sendPasswordResetOtp(normalizedEmail, otp, 10);
  return { success: true, message: 'A 6-digit OTP has been sent to your email.', expiresInMinutes: 10 };
}

async function confirmPasswordReset({ token, newPassword, email }) {
  if (!/^\d{6}$/.test(token)) throw Object.assign(new Error('Invalid OTP format.'), { status: 400 });
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token }, include: { user: true } });
  if (!resetToken) throw Object.assign(new Error('Invalid or expired OTP.'), { status: 400 });
  if (email && resetToken.user.email !== email.toLowerCase().trim()) throw Object.assign(new Error('Invalid or expired OTP.'), { status: 400 });
  if (resetToken.used || resetToken.expiresAt < new Date()) throw Object.assign(new Error('OTP has expired.'), { status: 400 });
  if (resetToken.attemptCount >= 3) {
    await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } });
    throw Object.assign(new Error('Too many failed attempts.'), { status: 400 });
  }
  await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { attemptCount: resetToken.attemptCount + 1 } });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
  await prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { used: true } });
  return { success: true, message: 'Password has been reset successfully.' };
}

async function validateResetToken(token) {
  if (!/^\d{6}$/.test(token)) return { success: false, message: 'Invalid or expired token' };
  const t = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!t || t.used || t.expiresAt < new Date()) return { success: false, message: 'Invalid or expired token' };
  return { success: true, message: 'Token is valid' };
}

async function sendVerificationEmail(email, ip, ua) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) throw Object.assign(new Error('Email address not found.'), { status: 400 });
  if (!user.active) throw Object.assign(new Error('Account is inactive.'), { status: 400 });
  if (user.emailVerified) return { success: true, message: 'Email is already verified.' };

  const lastToken = await prisma.emailVerificationToken.findFirst({ where: { email: normalizedEmail }, orderBy: { createdAt: 'desc' } });
  if (lastToken) {
    const secs = Math.floor((Date.now() - lastToken.createdAt.getTime()) / 1000);
    if (secs < COOLDOWN_SECONDS) throw Object.assign(new Error(`Please wait ${COOLDOWN_SECONDS - secs} seconds.`), { status: 400 });
  }

  await prisma.emailVerificationToken.updateMany({ where: { email: normalizedEmail, verified: false }, data: { verified: true } });
  const otp = generateOtp();
  await prisma.emailVerificationToken.create({ data: { userId: user.id, token: otp, email: normalizedEmail, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000), ipAddress: ip, userAgent: ua } });
  await emailService.sendEmailVerificationOtp(normalizedEmail, otp, OTP_EXPIRY_MINUTES);
  return { success: true, message: `OTP sent. Expires in ${OTP_EXPIRY_MINUTES} minutes.`, expiresInMinutes: OTP_EXPIRY_MINUTES };
}

async function verifyEmail(token, ip, ua) {
  if (!/^\d{6}$/.test(token)) throw Object.assign(new Error('Invalid OTP format.'), { status: 400 });
  const vt = await prisma.emailVerificationToken.findUnique({ where: { token }, include: { user: true } });
  if (!vt || vt.verified || vt.expiresAt < new Date()) throw Object.assign(new Error('Invalid or expired OTP.'), { status: 400 });
  if (vt.attemptCount >= 3) {
    await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { verified: true } });
    throw Object.assign(new Error('Too many failed attempts.'), { status: 400 });
  }
  await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { attemptCount: vt.attemptCount + 1 } });
  await prisma.user.update({ where: { id: vt.userId }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
  await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { verified: true } });
  return { success: true, message: 'Email verified successfully!' };
}

async function verifyEmailWithOtp(email, otp, ip, ua) {
  if (!/^\d{6}$/.test(otp)) throw Object.assign(new Error('Invalid OTP format.'), { status: 400 });
  const normalizedEmail = email?.toLowerCase().trim();
  const vt = await prisma.emailVerificationToken.findFirst({ where: { token: otp, email: normalizedEmail }, include: { user: true } });
  if (!vt || vt.verified || vt.expiresAt < new Date()) throw Object.assign(new Error('Invalid or expired OTP.'), { status: 400 });
  if (vt.attemptCount >= 3) {
    await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { verified: true } });
    throw Object.assign(new Error('Too many failed attempts.'), { status: 400 });
  }
  await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { attemptCount: vt.attemptCount + 1 } });
  await prisma.user.update({ where: { id: vt.userId }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
  await prisma.emailVerificationToken.update({ where: { id: vt.id }, data: { verified: true } });
  return { success: true, message: 'Email verified successfully!' };
}

async function resendVerificationEmail(userId, ip, ua) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found.'), { status: 400 });
  if (user.emailVerified) return { success: true, message: 'Email is already verified.' };
  const email = user.email;
  await prisma.emailVerificationToken.updateMany({ where: { email, verified: false }, data: { verified: true } });
  const otp = generateOtp();
  await prisma.emailVerificationToken.create({ data: { userId: user.id, token: otp, email, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000), ipAddress: ip, userAgent: ua } });
  await emailService.sendEmailVerificationOtp(email, otp, OTP_EXPIRY_MINUTES);
  return { success: true, message: `OTP resent. Expires in ${OTP_EXPIRY_MINUTES} minutes.` };
}

async function validateVerificationToken(token) {
  if (!/^\d{6}$/.test(token)) return { success: false, message: 'Invalid or expired OTP' };
  const t = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!t || t.verified || t.expiresAt < new Date()) return { success: false, message: 'Invalid or expired OTP' };
  return { success: true, message: 'OTP is valid' };
}

async function checkEmailVerified(email) {
  const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase().trim() } });
  if (user?.emailVerified) return { success: true, message: 'Email is verified' };
  return { success: false, message: 'Email is not verified' };
}

module.exports = {
  register, login, refreshToken, logout,
  initiatePasswordReset, confirmPasswordReset, validateResetToken,
  sendVerificationEmail, verifyEmail, verifyEmailWithOtp, resendVerificationEmail,
  validateVerificationToken, checkEmailVerified,
};
