const jwt = require('jsonwebtoken');

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
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userRoles = req.user.roles || [];
    const hasRole = roles.some(r => userRoles.includes(`ROLE_${r}`) || userRoles.includes(r));
    if (!hasRole) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

function getClientIp(req) {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

module.exports = { authenticate, requireRole, getClientIp };
