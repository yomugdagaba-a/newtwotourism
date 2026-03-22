const auditService = require('../services/audit.service');
const { getClientIp } = require('./auth.middleware');

// Maps HTTP method + URL to an AuditAction enum value (mirrors NestJS interceptor)
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
 * POST, PUT, PATCH, and DELETE requests — mirroring the NestJS AuditInterceptor.
 *
 * It wraps res.json() so it fires after the response is built, capturing both
 * successful operations and failures.
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
          body,
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
