/**
 * SSE Controller
 *
 * GET /api/sse/bookings?token=<jwt>
 *
 * EventSource (browser) cannot send custom headers, so the JWT is passed
 * as a query parameter instead of the Authorization header.
 */

const { Router } = require('express');
const jwt = require('jsonwebtoken');
const sseService = require('../services/sse.service');

const router = Router();

router.get('/bookings', (req, res) => {
  // ── Auth: read token from query param ──────────────────────────────────
  const token = req.query.token;
  if (!token) {
    return res.status(401).json({ message: 'Missing token' });
  }

  let userId;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    userId = payload.userId;
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  if (!userId) {
    return res.status(401).json({ message: 'Invalid token payload' });
  }

  // ── Register SSE connection ─────────────────────────────────────────────
  sseService.addClient(userId, res);

  // Keep the request open — do NOT call next() or send a response
});

module.exports = router;
