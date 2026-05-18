/**
 * Rate Limiting Middleware
 * 
 * Implements multiple rate limiting strategies to protect against:
 * - Brute force attacks
 * - DDoS attacks
 * - API abuse
 * - Resource exhaustion
 * 
 * Uses Redis for distributed rate limiting (falls back to in-memory if Redis unavailable)
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { getRedisClient, isRedisConnected } = require('../lib/redis');

// ══════════════════════════════════════════════════════════════════════════════
// REDIS STORE FACTORY
// ══════════════════════════════════════════════════════════════════════════════

// Cache stores so we don't create a new one on every request
const storeCache = {};

/**
 * Get Redis store for rate limiting (lazy - created on first use after Redis is ready)
 * Falls back to in-memory if Redis is not available
 */
function getStore(prefix = 'rl') {
  // If Redis is not connected, return undefined (use in-memory)
  if (!isRedisConnected()) {
    return undefined;
  }

  // Return cached store if already created
  if (storeCache[prefix]) {
    return storeCache[prefix];
  }

  // Create and cache a new Redis store
  const redisClient = getRedisClient();
  storeCache[prefix] = new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: `rl:${prefix}:`,
  });

  return storeCache[prefix];
}

/**
 * Create a rate limiter that uses Redis store lazily
 * This wrapper ensures Redis store is used once Redis is connected
 */
function createLimiter(options) {
  const { storePrefix, ...rateLimitOptions } = options;
  
  return (req, res, next) => {
    // Get store at request time (Redis may have connected after startup)
    const store = getStore(storePrefix);
    
    // Create limiter with current store
    const limiter = rateLimit({
      ...rateLimitOptions,
      store,
    });
    
    return limiter(req, res, next);
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION FROM ENVIRONMENT VARIABLES
// ══════════════════════════════════════════════════════════════════════════════

const RATE_LIMITS = {
  global: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX) || 1000,
  login: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 5,
  register: parseInt(process.env.RATE_LIMIT_REGISTER_MAX) || 3,
  passwordReset: parseInt(process.env.RATE_LIMIT_PASSWORD_RESET_MAX) || 3,
  emailVerification: parseInt(process.env.RATE_LIMIT_EMAIL_VERIFICATION_MAX) || 5,
  booking: parseInt(process.env.RATE_LIMIT_BOOKING_MAX) || 10,
  fileUpload: parseInt(process.env.RATE_LIMIT_FILE_UPLOAD_MAX) || 20,
  rating: parseInt(process.env.RATE_LIMIT_RATING_MAX) || 10,
  admin: parseInt(process.env.RATE_LIMIT_ADMIN_MAX) || 500,
};

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

const RATE_LIMIT_CONFIG = {
  // Standard headers to include in responses
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable `X-RateLimit-*` headers
  
  // Skip successful requests (only count failures for auth endpoints)
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  
  // Custom key generator (use IP address)
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
};

// Special key generator for login (IP + User-Agent combination)
// This prevents one device from blocking others at the same location
// Each device (phone, laptop, tablet) gets its own limit
const loginKeyGenerator = (req) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  // Create a simple hash of user-agent to keep key short
  const agentHash = userAgent.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '');
  return `${ip}-${agentHash}`;
};

// ══════════════════════════════════════════════════════════════════════════════
// 1. GLOBAL API RATE LIMITER
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Global rate limiter for all API endpoints
 * Prevents general API abuse
 */
const globalLimiter = createLimiter({
  storePrefix: 'global',
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMITS.global,
  message: 'Too many requests from this IP, please try again later.',
  ...RATE_LIMIT_CONFIG
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. AUTHENTICATION RATE LIMITERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Strict rate limiter for login attempts
 * Prevents brute force attacks
 * Uses IP + User-Agent (device fingerprint) to track each device separately
 * This allows multiple devices at same location to login independently
 */
const loginLimiter = createLimiter({
  storePrefix: 'login',
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMITS.login,
  skipSuccessfulRequests: true,
  keyGenerator: loginKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many login attempts from this device. Please try again after 15 minutes.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

const registerLimiter = createLimiter({
  storePrefix: 'register',
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.register,
  message: 'Too many accounts created from this IP. Please try again after an hour.',
  ...RATE_LIMIT_CONFIG
});

const passwordResetLimiter = createLimiter({
  storePrefix: 'password-reset',
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.passwordReset,
  message: 'Too many password reset requests. Please try again after an hour.',
  ...RATE_LIMIT_CONFIG
});

const emailVerificationLimiter = createLimiter({
  storePrefix: 'email-verify',
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMITS.emailVerification,
  message: 'Too many verification requests. Please try again after 15 minutes.',
  ...RATE_LIMIT_CONFIG
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. RESOURCE CREATION RATE LIMITERS
// ══════════════════════════════════════════════════════════════════════════════

const bookingCreationLimiter = createLimiter({
  storePrefix: 'booking',
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.booking,
  message: 'Too many booking requests. Please try again later.',
  ...RATE_LIMIT_CONFIG
});

const fileUploadLimiter = createLimiter({
  storePrefix: 'upload',
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMITS.fileUpload,
  message: 'Too many file uploads. Please try again later.',
  ...RATE_LIMIT_CONFIG
});

const ratingCreationLimiter = createLimiter({
  storePrefix: 'rating',
  windowMs: 60 * 60 * 1000,
  max: RATE_LIMITS.rating,
  message: 'Too many rating submissions. Please try again later.',
  ...RATE_LIMIT_CONFIG
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. ADMIN OPERATION RATE LIMITERS
// ══════════════════════════════════════════════════════════════════════════════

const adminLimiter = createLimiter({
  storePrefix: 'admin',
  windowMs: 15 * 60 * 1000,
  max: RATE_LIMITS.admin,
  message: 'Too many admin requests. Please try again later.',
  ...RATE_LIMIT_CONFIG
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. PUBLIC READ RATE LIMITERS
// ══════════════════════════════════════════════════════════════════════════════

const publicReadLimiter = createLimiter({
  storePrefix: 'public',
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests. Please try again later.',
  ...RATE_LIMIT_CONFIG
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
  publicReadLimiter
};
