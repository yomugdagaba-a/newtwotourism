/**
 * Rate Limiting Middleware
 * 
 * Implements multiple rate limiting strategies to protect against:
 * - Brute force attacks
 * - DDoS attacks
 * - API abuse
 * - Resource exhaustion
 */

const rateLimit = require('express-rate-limit');

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
// Example:
//   Phone (Chrome):   197.156.89.45-ChromeMobile     → 5 attempts
//   Laptop (Firefox): 197.156.89.45-FirefoxDesktop   → 5 attempts
//   Tablet (Safari):  197.156.89.45-SafariiPad       → 5 attempts
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
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: RATE_LIMITS.global,    // From env or default 1000
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
 * 
 * Example at an office with 10 users:
 *   User 1 Phone (Chrome):   5 attempts
 *   User 2 Laptop (Firefox): 5 attempts
 *   User 3 Tablet (Safari):  5 attempts
 *   ... each device gets 5 attempts
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: RATE_LIMITS.login,     // From env or default 5
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: loginKeyGenerator, // Use IP + Device fingerprint
  message: 'Too many login attempts from this device. Please try again after 15 minutes.',
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

/**
 * Rate limiter for registration
 * Prevents spam account creation
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: RATE_LIMITS.register,  // From env or default 3
  message: 'Too many accounts created from this IP. Please try again after an hour.',
  ...RATE_LIMIT_CONFIG
});

/**
 * Rate limiter for password reset requests
 * Prevents email flooding
 */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: RATE_LIMITS.passwordReset, // From env or default 3
  message: 'Too many password reset requests. Please try again after an hour.',
  ...RATE_LIMIT_CONFIG
});

/**
 * Rate limiter for email verification
 * Prevents email flooding
 */
const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: RATE_LIMITS.emailVerification, // From env or default 5
  message: 'Too many verification requests. Please try again after 15 minutes.',
  ...RATE_LIMIT_CONFIG
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. RESOURCE CREATION RATE LIMITERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Rate limiter for creating bookings
 * Prevents spam bookings
 */
const bookingCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: RATE_LIMITS.booking,   // From env or default 10
  message: 'Too many booking requests. Please try again later.',
  ...RATE_LIMIT_CONFIG
});

/**
 * Rate limiter for file uploads
 * Prevents storage abuse
 */
const fileUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: RATE_LIMITS.fileUpload, // From env or default 20
  message: 'Too many file uploads. Please try again later.',
  ...RATE_LIMIT_CONFIG
});

/**
 * Rate limiter for creating ratings/reviews
 * Prevents spam reviews
 */
const ratingCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: RATE_LIMITS.rating,    // From env or default 10
  message: 'Too many rating submissions. Please try again later.',
  ...RATE_LIMIT_CONFIG
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. ADMIN OPERATION RATE LIMITERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Rate limiter for admin operations
 * More lenient for authenticated admins
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: RATE_LIMITS.admin,     // From env or default 500
  message: 'Too many admin requests. Please try again later.',
  ...RATE_LIMIT_CONFIG
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. PUBLIC READ RATE LIMITERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Rate limiter for public read endpoints
 * More lenient for browsing
 */
const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 500,                   // 500 requests per 15 minutes
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
