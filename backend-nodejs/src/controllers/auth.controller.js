const { Router } = require('express');
const { authenticate, getClientIp } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate');
const { RegisterDto, LoginDto, RefreshTokenDto, PasswordResetRequestDto, PasswordResetConfirmDto, EmailVerificationRequestDto } = require('../dto/auth.dto');
const authService = require('../services/auth.service');

const router = Router();

router.post('/register', validate(RegisterDto), async (req, res, next) => {
  try { res.status(201).json(await authService.register(req.body)); } catch (e) { next(e); }
});

router.post('/login', validate(LoginDto), async (req, res, next) => {
  try { res.json(await authService.login(req.body, getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
});

router.post('/refresh', validate(RefreshTokenDto), async (req, res, next) => {
  try { res.json(await authService.refreshToken(req.body.refreshToken)); } catch (e) { next(e); }
});

router.post('/logout', authenticate, async (req, res, next) => {
  try { await authService.logout(req.user.userId); res.json({ message: 'Logged out successfully' }); } catch (e) { next(e); }
});

// Password reset
router.post('/reset-password', validate(PasswordResetRequestDto), async (req, res, next) => {
  try { res.json(await authService.initiatePasswordReset(req.body.email, getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
});

router.post('/reset-password/confirm', validate(PasswordResetConfirmDto), async (req, res, next) => {
  try { res.json(await authService.confirmPasswordReset(req.body)); } catch (e) { next(e); }
});

router.get('/reset-password/validate', async (req, res, next) => {
  try { res.json(await authService.validateResetToken(req.query.token)); } catch (e) { next(e); }
});

// Email verification
router.post('/send-verification', validate(EmailVerificationRequestDto), async (req, res, next) => {
  try { res.json(await authService.sendVerificationEmail(req.body.email, getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
});

router.post('/verify-email', async (req, res, next) => {
  try { res.json(await authService.verifyEmail(req.query.token, getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
});

router.post('/verify-email-otp', async (req, res, next) => {
  try { res.json(await authService.verifyEmailWithOtp(req.query.email, req.query.otp, getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
});

router.post('/resend-verification', async (req, res, next) => {
  try { res.json(await authService.resendVerificationEmail(parseInt(req.query.userId), getClientIp(req), req.get('user-agent') || '')); } catch (e) { next(e); }
});

router.get('/verify-email/validate', async (req, res, next) => {
  try { res.json(await authService.validateVerificationToken(req.query.token)); } catch (e) { next(e); }
});

router.get('/email-verified', async (req, res, next) => {
  try { res.json(await authService.checkEmailVerified(req.query.email)); } catch (e) { next(e); }
});

module.exports = router;
