const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userRepository, authRepository, roleRepository } = require('../repositories');
const emailService = require('./email.service');
const emailValidator = require('./email-validator.service');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';
const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7h';
const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_FAILED_ATTEMPTS || '5');
const LOCKOUT_DURATION_MINUTES = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15');
const MAX_IP_ATTEMPTS_PER_HOUR = parseInt(process.env.MAX_IP_ATTEMPTS_PER_HOUR || '100');
const OTP_EXPIRY_MINUTES = 5;
const COOLDOWN_SECONDS = 60;

class AuthService {
  _parseExpiry(exp) {
    const m = String(exp).match(/^(\d+)([smhd])$/);
    if (!m) return 900;
    const v = parseInt(m[1]);
    const map = { s: 1, m: 60, h: 3600, d: 86400 };
    return v * (map[m[2]] || 1);
  }

  _generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async shouldBlockIpAddress(ipAddress) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const attempts = await authRepository.getRecentLoginAttempts(ipAddress, 60);
    return attempts.length >= MAX_IP_ATTEMPTS_PER_HOUR;
  }

  async shouldBlockIdentifier(ipAddress) {
    const attempts = await authRepository.getRecentLoginAttempts(ipAddress, 60);
    const failures = attempts.filter(a => !a.success);
    return failures.length >= MAX_FAILED_ATTEMPTS;
  }

  async getProgressiveDelay(ipAddress) {
    const attempts = await authRepository.getRecentLoginAttempts(ipAddress, 60);
    const failures = attempts.filter(a => !a.success).length;
    if (failures <= 1) return 0;
    if (failures === 2) return 1;
    if (failures === 3) return 2;
    if (failures === 4) return 4;
    if (failures === 5) return 8;
    if (failures === 6) return 16;
    return 30;
  }

  async detectSuspiciousActivity(ipAddress) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const attempts = await authRepository.getRecentLoginAttempts(ipAddress, 5);
    return attempts.filter(a => !a.success).length >= 5;
  }

  async sendSecurityAlert(userId, alertType, ipAddress) {
    try {
      const user = await userRepository.findById(userId);
      if (!user?.email) return;
      let subject, html;
      switch (alertType) {
        case 'ACCOUNT_LOCKED':
          subject = 'Account Temporarily Locked — North Wollo Tourism';
          html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
            <h2 style="color:#dc2626;">🔒 Account Temporarily Locked</h2>
            <p>Your account has been temporarily locked due to multiple failed login attempts from IP: <strong>${ipAddress}</strong>.</p>
            <p>It will automatically unlock in <strong>${LOCKOUT_DURATION_MINUTES} minutes</strong>.</p>
          </div>`;
          break;
        case 'ACCOUNT_UNLOCKED':
          subject = 'Account Unlocked — North Wollo Tourism';
          html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
            <h2 style="color:#15803d;">✓ Account Unlocked</h2>
            <p>Your account has been unlocked by an administrator. You can now log in.</p>
          </div>`;
          break;
        case 'SUSPICIOUS_ACTIVITY':
          subject = 'Suspicious Login Activity — North Wollo Tourism';
          html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
            <h2 style="color:#d97706;">⚠️ Suspicious Activity Detected</h2>
            <p>Suspicious login activity was detected on your account from IP: <strong>${ipAddress}</strong>.</p>
          </div>`;
          break;
        default:
          subject = 'Security Alert — North Wollo Tourism';
          html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
            <h2 style="color:#dc2626;">Security Alert</h2><p>${alertType} from IP: ${ipAddress}</p>
          </div>`;
      }
      await emailService.sendEmail(user.email, subject, html);
    } catch (e) { console.error('Failed to send security alert:', e.message); }
  }

  async lockUserAccount(userId, reason, triggerIpAddress) {
    try {
      const existing = await authRepository.findLockout(userId);
      if (existing && existing.lockedUntil > new Date()) return;
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);
      await authRepository.createLockout(userId, lockedUntil);
      await this.sendSecurityAlert(userId, 'ACCOUNT_LOCKED', triggerIpAddress);
    } catch (e) { console.error('Failed to lock user account:', e.message); }
  }

  async isUserLockedOut(userId) {
    try {
      return await authRepository.isAccountLocked(userId);
    } catch (e) { return false; }
  }

  async unlockUserAccount(userId) {
    try {
      await authRepository.deleteLockout(userId);
      await this.sendSecurityAlert(userId, 'ACCOUNT_UNLOCKED', 'ADMIN');
    } catch (e) { console.error('Failed to unlock user account:', e.message); }
  }

  async cleanupOldSecurityRecords(retentionDays = 90) {
    try {
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      const prisma = require('../lib/prisma');
      const result = await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: cutoff } } });
      return result.count;
    } catch (e) { return 0; }
  }

  async generateTokens(user) {
    const roles = user.roles.map(r => `ROLE_${r.name}`);
    const payload = { sub: user.username, userId: user.id, roles };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
    const refreshPayload = { ...payload, jti: `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    const refreshToken = jwt.sign(refreshPayload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });

    await authRepository.deleteUserRefreshTokens(user.id);
    await authRepository.createRefreshToken({
      userId: user.id, token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 86400000),
    });

    const expiresIn = this._parseExpiry(JWT_EXPIRATION);
    return {
      token: accessToken, accessToken, refreshToken,
      expiresIn, expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      userId: user.id,
      user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName, roles: user.roles.map(r => r.name) },
    };
  }

  async register({ username, email, password, fullName }) {
    const emailValidation = await emailValidator.validateEmail(email, { checkMX: true, blockDisposable: true, checkSuspicious: false, checkTypos: true });
    if (!emailValidation.valid) throw Object.assign(new Error(emailValidation.errors.join(', ')), { status: 400 });

    const normalizedEmail = emailValidation.email;
    const existingByUsername = await userRepository.findByUsername(username);
    const existingByEmail = await userRepository.findByEmail(normalizedEmail);
    const existing = existingByUsername || existingByEmail;

    if (existing) {
      if (!existing.emailVerified) {
        const prisma = require('../lib/prisma');
        await prisma.emailVerificationToken.deleteMany({ where: { userId: existing.id } });
        await prisma.passwordResetToken.deleteMany({ where: { userId: existing.id } });
        await authRepository.deleteUserRefreshTokens(existing.id);
        await prisma.loginAttempt.deleteMany({ where: { userId: existing.id } });
        await prisma.accountLockout.deleteMany({ where: { userId: existing.id } });
        await userRepository.delete(existing.id);
      } else {
        throw Object.assign(new Error('Username or email already exists'), { status: 400 });
      }
    }

    const prisma = require('../lib/prisma');
    await prisma.role.upsert({ where: { name: 'CLIENT' }, update: {}, create: { name: 'CLIENT' } });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username, email: normalizedEmail, passwordHash, fullName,
        roles: { connect: { name: 'CLIENT' } },
        emailVerified: process.env.NODE_ENV === 'test',
        emailVerifiedAt: process.env.NODE_ENV === 'test' ? new Date() : null,
      },
      include: { roles: true },
    });

    try {
      const otp = this._generateOtp();
      await authRepository.createEmailToken({ userId: user.id, token: otp, email: normalizedEmail, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000) });
      const emailTimeout = new Promise(resolve => setTimeout(() => resolve(false), 8000));
      const emailSent = await Promise.race([
        emailService.sendEmailVerificationOtp(normalizedEmail, otp, OTP_EXPIRY_MINUTES, fullName || username),
        emailTimeout,
      ]);
      if (!emailSent) console.warn(`⚠️ Verification email may not have sent to ${normalizedEmail}`);
    } catch (e) { console.error('Verification token creation failed (non-fatal):', e.message); }

    return this.generateTokens(user);
  }

  async login({ username, password }, ip = 'unknown', ua = 'unknown') {
    if (await this.shouldBlockIpAddress(ip)) {
      await authRepository.recordLoginAttempt({ ipAddress: ip, success: false, reason: 'IP blocked' });
      throw Object.assign(new Error('Too many requests from this IP address. Please try again later.'), { status: 429 });
    }

    const user = await userRepository.findByUsername(username) || await userRepository.findByEmail(username);

    if (await this.shouldBlockIdentifier(ip)) {
      await authRepository.recordLoginAttempt({ userId: user?.id, ipAddress: ip, success: false, reason: 'Identifier blocked' });
      throw Object.assign(new Error('Too many failed login attempts. Please try again later.'), { status: 429 });
    }

    const delay = await this.getProgressiveDelay(ip);
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay * 1000));

    if (user && await this.isUserLockedOut(user.id)) {
      await authRepository.recordLoginAttempt({ userId: user.id, ipAddress: ip, success: false, reason: 'Account locked' });
      throw Object.assign(new Error('Account is temporarily locked. Please try again later.'), { status: 401 });
    }

    if (!user) {
      await authRepository.recordLoginAttempt({ ipAddress: ip, success: false, reason: 'User not found' });
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await authRepository.recordLoginAttempt({ userId: user.id, ipAddress: ip, success: false, reason: 'Invalid password' });
      const attempts = await authRepository.getRecentLoginAttempts(ip, 60);
      const failures = attempts.filter(a => !a.success).length;
      if (failures >= MAX_FAILED_ATTEMPTS) {
        await this.lockUserAccount(user.id, `Account locked due to ${failures} consecutive failed login attempts`, ip);
      }
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }

    if (!user.active) {
      await authRepository.recordLoginAttempt({ userId: user.id, ipAddress: ip, success: false, reason: 'Inactive account' });
      throw Object.assign(new Error('User account is inactive'), { status: 401 });
    }

    if (!user.emailVerified) {
      await authRepository.recordLoginAttempt({ userId: user.id, ipAddress: ip, success: false, reason: 'Email not verified' });
      throw Object.assign(new Error('Please verify your email address before logging in.'), { status: 403 });
    }

    this.detectSuspiciousActivity(ip).then(suspicious => {
      if (suspicious) this.sendSecurityAlert(user.id, 'SUSPICIOUS_ACTIVITY', ip).catch(() => {});
    }).catch(() => {});

    await authRepository.recordLoginAttempt({ userId: user.id, ipAddress: ip, success: true });
    return this.generateTokens(user);
  }

  async refreshToken(token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await userRepository.findByIdWithRoles(payload.userId);
      if (!user) throw Object.assign(new Error('User not found'), { status: 401 });
      return this.generateTokens(user);
    } catch (e) {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
    }
  }

  async logout(userId) {
    await authRepository.deleteUserRefreshTokens(userId);
  }

  async initiatePasswordReset(email, ip, ua) {
    const emailValidation = await emailValidator.validateEmail(email, { checkMX: false, blockDisposable: true, checkSuspicious: false });
    if (!emailValidation.valid) throw Object.assign(new Error(emailValidation.errors.join(', ')), { status: 400 });

    const normalizedEmail = emailValidation.email;
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) throw Object.assign(new Error('This email is not registered.'), { status: 404 });
    if (!user.active) throw Object.assign(new Error('Account is inactive.'), { status: 400 });
    if (!user.emailVerified) throw Object.assign(new Error('Email address is not verified.'), { status: 403 });

    const prisma = require('../lib/prisma');
    const lastToken = await prisma.passwordResetToken.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
    if (lastToken) {
      const secs = Math.floor((Date.now() - lastToken.createdAt.getTime()) / 1000);
      if (secs < COOLDOWN_SECONDS) throw Object.assign(new Error(`Please wait ${COOLDOWN_SECONDS - secs} seconds before requesting another OTP.`), { status: 400 });
    }

    await prisma.passwordResetToken.updateMany({ where: { userId: user.id, used: false }, data: { used: true } });
    const otp = this._generateOtp();
    await authRepository.createPasswordToken({ userId: user.id, token: otp, expiresAt: new Date(Date.now() + 10 * 60000), ipAddress: ip });
    await emailService.sendPasswordResetOtp(normalizedEmail, otp, 10);
    return { success: true, message: 'A 6-digit OTP has been sent to your email.', expiresInMinutes: 10 };
  }

  async confirmPasswordReset({ token, newPassword, email }) {
    if (!/^\d{6}$/.test(token)) throw Object.assign(new Error('Invalid OTP format.'), { status: 400 });
    const resetToken = await authRepository.findPasswordToken(token);
    if (!resetToken) throw Object.assign(new Error('Invalid or expired OTP.'), { status: 400 });
    if (email && resetToken.user.email !== email.toLowerCase().trim()) throw Object.assign(new Error('Invalid or expired OTP.'), { status: 400 });
    if (resetToken.used || resetToken.expiresAt < new Date()) throw Object.assign(new Error('OTP has expired.'), { status: 400 });
    if (resetToken.attemptCount >= 3) {
      await authRepository.markPasswordTokenUsed(token);
      throw Object.assign(new Error('Too many failed attempts.'), { status: 400 });
    }
    await authRepository.incrementPasswordTokenAttempt(token);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(resetToken.userId, passwordHash);
    await authRepository.markPasswordTokenUsed(token);
    return { success: true, message: 'Password has been reset successfully.' };
  }

  async validateResetToken(token) {
    if (!/^\d{6}$/.test(token)) return { success: false, message: 'Invalid or expired token' };
    const t = await authRepository.findPasswordToken(token);
    if (!t || t.used || t.expiresAt < new Date()) return { success: false, message: 'Invalid or expired token' };
    return { success: true, message: 'Token is valid' };
  }

  async sendVerificationEmail(email, ip, ua) {
    const emailValidation = await emailValidator.validateEmail(email, { checkMX: false, blockDisposable: true });
    if (!emailValidation.valid) throw Object.assign(new Error(emailValidation.errors.join(', ')), { status: 400 });

    const normalizedEmail = emailValidation.email;
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) throw Object.assign(new Error('Email address not found.'), { status: 400 });
    if (!user.active) throw Object.assign(new Error('Account is inactive.'), { status: 400 });
    if (user.emailVerified) return { success: true, message: 'Email is already verified.' };

    const prisma = require('../lib/prisma');
    const lastToken = await prisma.emailVerificationToken.findFirst({ where: { email: normalizedEmail }, orderBy: { createdAt: 'desc' } });
    if (lastToken) {
      const secs = Math.floor((Date.now() - lastToken.createdAt.getTime()) / 1000);
      if (secs < COOLDOWN_SECONDS) throw Object.assign(new Error(`Please wait ${COOLDOWN_SECONDS - secs} seconds.`), { status: 400 });
    }

    await prisma.emailVerificationToken.updateMany({ where: { email: normalizedEmail, verified: false }, data: { verified: true } });
    const otp = this._generateOtp();
    await authRepository.createEmailToken({ userId: user.id, token: otp, email: normalizedEmail, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000), ipAddress: ip, userAgent: ua });
    await emailService.sendEmailVerificationOtp(normalizedEmail, otp, OTP_EXPIRY_MINUTES, user.fullName || user.username);
    return { success: true, message: `OTP sent. Expires in ${OTP_EXPIRY_MINUTES} minutes.`, expiresInMinutes: OTP_EXPIRY_MINUTES };
  }

  async verifyEmail(token, ip, ua) {
    if (!/^\d{6}$/.test(token)) throw Object.assign(new Error('Invalid OTP format.'), { status: 400 });
    const vt = await authRepository.findEmailToken(token);
    if (!vt || vt.verified || vt.expiresAt < new Date()) throw Object.assign(new Error('Invalid or expired OTP.'), { status: 400 });
    if (vt.attemptCount >= 3) {
      await authRepository.markEmailTokenVerified(token);
      throw Object.assign(new Error('Too many failed attempts.'), { status: 400 });
    }
    await authRepository.incrementEmailTokenAttempt(token);
    await userRepository.verifyEmail(vt.userId);
    await authRepository.markEmailTokenVerified(token);
    return { success: true, message: 'Email verified successfully!' };
  }

  async verifyEmailWithOtp(email, otp, ip, ua) {
    if (!/^\d{6}$/.test(otp)) throw Object.assign(new Error('Invalid OTP format.'), { status: 400 });
    const normalizedEmail = email?.toLowerCase().trim();
    const prisma = require('../lib/prisma');
    const vt = await prisma.emailVerificationToken.findFirst({ where: { token: otp, email: normalizedEmail }, include: { user: true } });
    if (!vt || vt.verified || vt.expiresAt < new Date()) throw Object.assign(new Error('Invalid or expired OTP.'), { status: 400 });
    if (vt.attemptCount >= 3) {
      await authRepository.markEmailTokenVerified(otp);
      throw Object.assign(new Error('Too many failed attempts.'), { status: 400 });
    }
    await authRepository.incrementEmailTokenAttempt(otp);
    await userRepository.verifyEmail(vt.userId);
    await authRepository.markEmailTokenVerified(otp);
    return { success: true, message: 'Email verified successfully!' };
  }

  async resendVerificationEmail(userId, ip, ua) {
    const user = await userRepository.findById(userId);
    if (!user) throw Object.assign(new Error('User not found.'), { status: 400 });
    if (user.emailVerified) return { success: true, message: 'Email is already verified.' };
    const prisma = require('../lib/prisma');
    await prisma.emailVerificationToken.updateMany({ where: { email: user.email, verified: false }, data: { verified: true } });
    const otp = this._generateOtp();
    await authRepository.createEmailToken({ userId: user.id, token: otp, email: user.email, expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000), ipAddress: ip, userAgent: ua });
    await emailService.sendEmailVerificationOtp(user.email, otp, OTP_EXPIRY_MINUTES, user.fullName || user.username);
    return { success: true, message: `OTP resent. Expires in ${OTP_EXPIRY_MINUTES} minutes.` };
  }

  async validateVerificationToken(token) {
    if (!/^\d{6}$/.test(token)) return { success: false, message: 'Invalid or expired OTP' };
    const t = await authRepository.findEmailToken(token);
    if (!t || t.verified || t.expiresAt < new Date()) return { success: false, message: 'Invalid or expired OTP' };
    return { success: true, message: 'OTP is valid' };
  }

  async checkEmailVerified(email) {
    const user = await userRepository.findByEmail(email?.toLowerCase().trim());
    if (user?.emailVerified) return { success: true, message: 'Email is verified' };
    return { success: false, message: 'Email is not verified' };
  }
}

module.exports = new AuthService();
