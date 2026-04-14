const auditService = require('../services/audit.service');
const { getClientIp } = require('./auth.middleware');

// Fields that must NEVER appear in audit logs — security requirement
const SENSITIVE_FIELDS = new Set([
  'password', 'passwordhash', 'newpassword', 'oldpassword', 'confirmpassword',
  'token', 'refreshtoken', 'accesstoken', 'jwttoken',
  'otp', 'secret', 'apikey', 'authorization',
  'creditcard', 'cardnumber', 'cvv', 'pin',
  // also catch common variations
  'refresh_token', 'access_token', 'id_token', 'bearer',
]);

/**
 * Recursively redact sensitive fields from any object before storing in audit log.
 * Comparison is case-insensitive so "Password", "PASSWORD", "password" are all caught.
 */
function sanitizeBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeBody);
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = sanitizeBody(value);
    }
  }
  return clean;
}

function determineAction(method, url) {
  if (method === 'POST') {
    if (url.includes('/login')) return 'LOGIN';
    if (url.includes('/register')) return 'CREATE';
    if (url.includes('/password-reset')) return 'PASSWORD_RESET_REQUEST';
    if (url.includes('/verify-email')) return 'EMAIL_VERIFICATION_SEND';
    return 'CREATE';
  }
  if (method === 'PUT' || method === 'PATCH') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  return 'CREATE';
}

function determineEntityType(url) {
  if (url.includes('/users')) return 'USER';
  if (url.includes('/hotels')) return 'HOTEL';
  if (url.includes('/tourisms') || url.includes('/tourism')) return 'TOURISM';
  if (url.includes('/bookings')) return 'BOOKING';
  if (url.includes('/ratings')) return 'RATING';
  if (url.includes('/map-points')) return 'MAP_POINT';
  if (url.includes('/roads')) return 'ROAD';
  if (url.includes('/horse-services')) return 'HORSE_SERVICE';
  if (url.includes('/language-guiders') || url.includes('/guiders')) return 'LANGUAGE_GUIDER';
  if (url.includes('/auth')) return 'AUTH';
  if (url.includes('/admin')) return 'ADMIN';
  return 'UNKNOWN';
}

function extractEntityId(params, body) {
  if (params?.id) {
    const id = parseInt(params.id);
    if (!isNaN(id)) return id;
  }
  if (body?.id) {
    const id = parseInt(body.id);
    if (!isNaN(id)) return id;
  }
  return undefined;
}

/**
 * Express middleware that automatically records audit log entries for all
 * POST, PUT, PATCH, and DELETE requests.
 *
 * Sensitive fields (passwords, tokens, OTPs) are redacted before storage.
 */
function auditMiddleware(req, res, next) {
  const { method, url, params, body } = req;

  // Only log mutating operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next();
  }

  const ipAddress = getClientIp(req);
  const userAgent = req.get('user-agent') || 'Unknown';
  const action = determineAction(method, url);
  const entityType = determineEntityType(url);

  // Sanitize body — remove passwords, tokens, OTPs before storing
  const safeBody = sanitizeBody(body);

  // Wrap res.json to intercept the outgoing response
  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const userId = req.user?.userId || null;
    const entityId = extractEntityId(params, body);
    const status = res.statusCode;
    const failed = status >= 400;

    auditService
      .log(
        userId,
        action,
        entityType,
        entityId,
        {
          method,
          url,
          body: safeBody,
          params,
          status,
          ...(failed ? { error: data?.message || 'Request failed' } : {}),
        },
        ipAddress,
        userAgent,
      )
      .catch((err) => console.error('[AuditMiddleware] Failed to write audit log:', err));

    return originalJson(data);
  };

  next();
}

module.exports = { auditMiddleware };
