const auditService = require('../services/audit.service');
const { getClientIp } = require('./auth.middleware');

// Fields that must NEVER appear in audit logs
const SENSITIVE_FIELDS = new Set([
  'password', 'passwordhash', 'newpassword', 'oldpassword', 'confirmpassword',
  'token', 'refreshtoken', 'accesstoken', 'jwttoken',
  'otp', 'secret', 'apikey', 'authorization',
  'creditcard', 'cardnumber', 'cvv', 'pin',
  'refresh_token', 'access_token', 'id_token', 'bearer',
]);

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i,
  /UNION\s+(ALL\s+)?SELECT/i,
  /DROP\s+(TABLE|DATABASE|INDEX)/i,
  /INSERT\s+INTO/i,
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE)/i,
  /--\s*$/,
  /\/\*.*\*\//,
  /xp_cmdshell/i,
  /EXEC(\s|\()/i,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on\w+\s*=/i,          // onclick=, onload=, onerror= etc.
  /<iframe/i,
  /<img[^>]+src\s*=\s*['"]?javascript/i,
  /eval\s*\(/i,
  /document\s*\.\s*cookie/i,
];

function containsSqlInjection(value) {
  if (typeof value !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(p => p.test(value));
}

function containsXss(value) {
  if (typeof value !== 'string') return false;
  return XSS_PATTERNS.some(p => p.test(value));
}

function scanForAttacks(obj) {
  if (!obj) return null;
  const values = typeof obj === 'object'
    ? Object.values(obj).map(v => String(v))
    : [String(obj)];
  for (const v of values) {
    if (containsSqlInjection(v)) return 'SQL_INJECTION';
    if (containsXss(v)) return 'XSS';
  }
  return null;
}

function sanitizeBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeBody);
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    clean[key] = SENSITIVE_FIELDS.has(key.toLowerCase()) ? '[REDACTED]' : sanitizeBody(value);
  }
  return clean;
}

function determineAction(method, url) {
  if (method === 'POST') {
    if (url.includes('/login')) return 'LOGIN';
    if (url.includes('/logout')) return 'LOGOUT';
    if (url.includes('/refresh')) return 'TOKEN_REFRESH';
    if (url.includes('/register')) return 'CREATE';
    if (url.includes('/reset-password') || url.includes('/password-reset')) return 'PASSWORD_RESET_REQUEST';
    if (url.includes('/confirm-reset') || url.includes('/confirm-password')) return 'PASSWORD_RESET_CONFIRM';
    if (url.includes('/verify-email') || url.includes('/send-verification')) return 'EMAIL_VERIFICATION_SEND';
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
  if (params?.id) { const id = parseInt(params.id); if (!isNaN(id)) return id; }
  if (body?.id)   { const id = parseInt(body.id);   if (!isNaN(id)) return id; }
  return undefined;
}

/**
 * Audit middleware — logs all mutating requests AND detects attack patterns
 * in GET query strings (SQL injection, XSS).
 */
function auditMiddleware(req, res, next) {
  const { method, url, params, body, query } = req;
  const ipAddress = getClientIp(req);
  const userAgent = req.get('user-agent') || 'Unknown';
  const entityType = determineEntityType(url);

  // ── Attack detection on GET requests (SQL injection / XSS in query params) ──
  if (method === 'GET' && query && Object.keys(query).length > 0) {
    const attackType = scanForAttacks(query);
    if (attackType) {
      // Log as AUTHORIZATION_CHECK (closest valid enum value for security violation)
      auditService.log(
        req.user?.userId || null,
        'AUTHORIZATION_CHECK',
        entityType,
        null,
        { attackType, url, query, detectedIn: 'query_params' },
        ipAddress,
        userAgent,
      ).catch(() => {});
    }
  }

  // ── Only log mutating operations in the normal audit trail ──
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return next();
  }

  const safeBody = sanitizeBody(body);

  // Attack detection on request body
  const bodyAttackType = scanForAttacks(safeBody);

  const originalJson = res.json.bind(res);
  res.json = function (data) {
    const status = res.statusCode;
    const failed = status >= 400;
    const action = determineAction(method, url);

    // For LOGIN/REGISTER: user is not yet authenticated when the middleware runs,
    // so req.user is null. Extract userId from the response body instead.
    let userId = req.user?.userId || null;
    if (!userId && data && typeof data === 'object') {
      if (data.userId) userId = data.userId;           // login/register response
      else if (data.user?.id) userId = data.user.id;  // some endpoints wrap in user object
    }

    const entityId = extractEntityId(params, body);

    // If attack pattern detected in body, log it separately as security event
    if (bodyAttackType) {
      auditService.log(
        userId,
        'AUTHORIZATION_CHECK',
        entityType,
        null,
        { attackType: bodyAttackType, url, detectedIn: 'request_body', status },
        ipAddress,
        userAgent,
      ).catch(() => {});
    }

    auditService.log(
      userId,
      action,
      entityType,
      entityId,
      {
        method,
        url,
        // For login/register, include the username from request body for traceability
        ...(url.includes('/login') || url.includes('/register')
          ? { username: body?.username || body?.usernameOrEmail || body?.email || null }
          : {}),
        body: safeBody,
        params,
        status,
        ...(failed ? { error: data?.message || 'Request failed' } : {}),
      },
      ipAddress,
      userAgent,
    ).catch((err) => console.error('[AuditMiddleware] Failed to write audit log:', err));

    return originalJson(data);
  };

  next();
}

module.exports = { auditMiddleware };
