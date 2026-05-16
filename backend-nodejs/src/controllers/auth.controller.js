const { Router } = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticate, getClientIp } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const {
  RegisterDto, LoginDto, RefreshTokenDto,
  PasswordResetRequestDto, PasswordResetConfirmDto, EmailVerificationRequestDto,
} = require('../dto/auth.dto');
const authService = require('../services/auth.service');

class AuthController {
  constructor() {
    this.router = Router();
    this._registerRoutes();
  }

  _registerRoutes() {
    this.router.post('/register', validate(RegisterDto), this.register.bind(this));
    this.router.post('/login', validate(LoginDto), this.login.bind(this));
    this.router.post('/refresh', validate(RefreshTokenDto), this.refresh.bind(this));
    this.router.post('/logout', authenticate, this.logout.bind(this));
    this.router.post('/revoke-token', authenticate, this.logout.bind(this));

    // Password reset
    this.router.post('/reset-password', validate(PasswordResetRequestDto), this.initiatePasswordReset.bind(this));
    this.router.post('/reset-password/confirm', validate(PasswordResetConfirmDto), this.confirmPasswordReset.bind(this));
    this.router.get('/reset-password/validate', this.validateResetToken.bind(this));

    // Email verification
    this.router.post('/send-verification', validate(EmailVerificationRequestDto), this.sendVerification.bind(this));
    this.router.post('/verify-email', this.verifyEmail.bind(this));
    this.router.post('/verify-email-otp', this.verifyEmailWithOtp.bind(this));
    this.router.post('/resend-verification', this.resendVerification.bind(this));
    this.router.get('/verify-email/validate', this.validateVerificationToken.bind(this));
    this.router.get('/email-verified', this.checkEmailVerified.bind(this));
    this.router.get('/validate-refresh-token', this.validateRefreshToken.bind(this));
  }

  async register(req, res, next) {
    try { res.status(201).json(await authService.register(req.body)); } catch (e) { next(e); }
  }

  async login(req, res, next) {
    try { res.json(await authService.login(req.body, getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
  }

  async refresh(req, res, next) {
    try { res.json(await authService.refreshToken(req.body.refreshToken)); } catch (e) { next(e); }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.userId);
      res.json({ message: 'Logged out successfully' });
    } catch (e) { next(e); }
  }

  async initiatePasswordReset(req, res, next) {
    try { res.json(await authService.initiatePasswordReset(req.body.email, getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
  }

  async confirmPasswordReset(req, res, next) {
    try { res.json(await authService.confirmPasswordReset(req.body)); } catch (e) { next(e); }
  }

  async validateResetToken(req, res, next) {
    try { res.json(await authService.validateResetToken(req.query.token)); } catch (e) { next(e); }
  }

  async sendVerification(req, res, next) {
    try { res.json(await authService.sendVerificationEmail(req.body.email, getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
  }

  async verifyEmail(req, res, next) {
    try { res.json(await authService.verifyEmail(req.query.token, getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
  }

  async verifyEmailWithOtp(req, res, next) {
    try { res.json(await authService.verifyEmailWithOtp(req.query.email, req.query.otp, getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
  }

  async resendVerification(req, res, next) {
    try { res.json(await authService.resendVerificationEmail(parseInt(req.query.userId), getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
  }

  async validateVerificationToken(req, res, next) {
    try { res.json(await authService.validateVerificationToken(req.query.token)); } catch (e) { next(e); }
  }

  async checkEmailVerified(req, res, next) {
    try { res.json(await authService.checkEmailVerified(req.query.email)); } catch (e) { next(e); }
  }

  async validateRefreshToken(req, res, next) {
    try {
      const token = req.query.token;
      if (!token) return res.json({ valid: false });
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const stored = await prisma.refreshToken.findFirst({ where: { token, userId: payload.userId } });
        if (!stored || stored.expiresAt < new Date()) return res.json({ valid: false });
        return res.json({ valid: true, userId: payload.userId });
      } catch { return res.json({ valid: false }); }
    } catch (e) { next(e); }
  }
}

module.exports = new AuthController().router;
