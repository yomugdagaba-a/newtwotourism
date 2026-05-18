/**
 * Rate Limiting Middleware
 *
 * Uses Redis for distributed rate limiting.
 * Falls back to in-memory if Redis is unavailable.
 *
 * IMPORTANT: All rateLimit() instances are created at module load time (app init),
 * not inside request handlers — required by express-rate-limit v7.
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getRedisClient, isRedisConnected } = require('../lib/redis');

// ══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT VARIABLES
// ══════════════════════════════════════════════════════════════════════════════

const RATE_LIMITS = {
  global:            parseInt(process.env.RATE_LIMIT_GLOBAL_MAX)             || 1000,
  login:             parseInt(process.env.RATE_LIMIT_LOGIN_MAX)              || 5,
  register:          parseInt(process.env.RATE_LIMIT_REGISTER_MAX)           || 3,
  passwordReset:     parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_MAX)     || 3,
  emailVerification: parseInt(process.env.RATE_LIMIT_EMAIL_VERIFICATION_MAX) || 5,
  booking:           parseInt(process.env.RATE_LIMIT_BOOKING_MAX)            || 10,
  fileUpload:        parseInt(process.env.RATE_LIMIT_FILE_UPLOAD_MAX)        || 20,
  rating:            parseInt(process.env.RATE_LIMIT_RATING_MAX)             || 10,
  admin:             parseInt(process.env.RATE_LIMIT_ADMIN_MAX)              || 500,
};

// ══════════════════════════════════════════════════════════════════════════════
// REDIS STORE HELPER
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Build a RedisStore for a given prefix.
 * Called at module load time — Redis must already be initialized before this
 * module is first required (initializeRedis() is called in index.js start()).
 */
function makeStore(prefix) {
  if (!isRedisConnected()) return undefined; // fall back to in-memory
  const client = getRedisClient();
  return new RedisStore({
    sendCommand: (...args) => client.sendCommand(args),
    prefix: `rl:${prefix}:`,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED HANDLER
// ══════════════════════════════════════════════════════════════════════════════

const defaultHandler = (req, res) => {
  res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// KEY GENERATORS
// ══════════════════════════════════════════════════════════════════════════════

// Default: IP only
const ipKeyGenerator = (req) =>
  req.ip || req.connection.remoteAddress || 'unknown';

// Login: IP + User-Agent so each device on the same network gets its own limit
const loginKeyGenerator = (req) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const ua = req.headers['user-agent'] || 'unknown';
  const uaHash = ua.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '');
  return `${ip}-${uaHash}`;
};

// ══════════════════════════════════════════════════════════════════════════════
// RATE LIMITERS  (created once at module load — NOT inside request handlers)
// ══════════════════════════════════════════════════════════════════════════════

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMITS.global,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: makeStore('global'),
  handler: defaultHandler,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMITS.login,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: loginKeyGenerator,
  store: makeStore('login'),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many login attempts from this device. Please try again after 15 minutes.',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.register,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: makeStore('register'),
  handler: defaultHandler,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.passwordReset,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: makeStore('password-reset'),
  handler: defaultHandler,
});

const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMITS.emailVerification,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: makeStore('email-verify'),
  handler: defaultHandler,
});

const bookingCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.booking,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: makeStore('booking'),
  handler: defaultHandler,
});

const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMITS.fileUpload,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: makeStore('upload'),
  handler: defaultHandler,
});

const ratingCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.rating,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: makeStore('rating'),
  handler: defaultHandler,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMITS.admin,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: makeStore('admin'),
  handler: defaultHandler,
});

const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: makeStore('public'),
  handler: defaultHandler,
});

// ══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════════════════

module.exports = {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  bookingCreationLimiter,
  fileUploadLimiter,
  ratingCreationLimiter,
  adminLimiter,
  publicReadLimiter,
};
