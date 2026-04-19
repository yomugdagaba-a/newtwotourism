const jwt = require('jsonwebtoken');
const auditService = require('../services/audit.service');

function getClientIp(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = {
      userId: payload.userId,
      username: payload.sub,
      roles: payload.roles || [],
    };
    next();
  } catch (err) {
    // SEC-03 / SEC-04: Log tampered or expired token attempts as security events
    const ip = getClientIp(req);
    const ua = req.get('user-agent') || 'Unknown';
    // Use SESSION_EXPIRED for expired tokens, AUTHORIZATION_CHECK for tampered/invalid tokens
    const action = err.name === 'TokenExpiredError' ? 'SESSION_EXPIRED' : 'AUTHORIZATION_CHECK';
    auditService.log(
      null,
      action,
      'AUTH',
      null,
      { reason: err.name, url: req.originalUrl, method: req.method },
      ip,
      ua,
    ).catch(() => {});
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userRoles = req.user.roles || [];
    const hasRole = roles.some(r => userRoles.includes(`ROLE_${r}`) || userRoles.includes(r));
    if (!hasRole) {
      // SEC-11 / SEC-12: Log privilege escalation attempts
      const ip = getClientIp(req);
      const ua = req.get('user-agent') || 'Unknown';
      auditService.log(
        req.user.userId,
        'AUTHORIZATION_CHECK',
        'AUTH',
        null,
        { reason: 'INSUFFICIENT_PERMISSIONS', requiredRoles: roles, userRoles, url: req.originalUrl, method: req.method },
        ip,
        ua,
      ).catch(() => {});
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole, getClientIp };
