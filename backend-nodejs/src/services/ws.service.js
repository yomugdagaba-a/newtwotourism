/**
 * WebSocket Service
 *
 * Single WebSocket connection per user handles ALL real-time features:
 *   - Booking updates  (new booking, status changes)
 *   - Messages         (new message in booking conversation)
 *   - Typing indicator (user is typing)
 *   - Online status    (user is on the bookings page)
 *
 * SSE (/api/sse) remains as a fallback for browsers that block WebSocket.
 *
 * ── Protocol ──────────────────────────────────────────────────────────────
 *
 * Client → Server (JSON):
 *   { type: "auth",    token: "<jwt>" }
 *   { type: "typing",  bookingId: 5, isTyping: true|false }
 *   { type: "ping" }
 *
 * Server → Client (JSON):
 *   { type: "connected",       userId, name }
 *   { type: "booking_new",     bookingId, hotelName, clientName, message, booking, timestamp }
 *   { type: "booking_update",  bookingId, bookingStatus, message, booking, timestamp }
 *   { type: "booking_message", bookingId, senderName, message, isFromOwner, booking, timestamp }
 *   { type: "typing",          bookingId, userId, name, isTyping }
 *   { type: "online",          userId, name, online }
 *   { type: "pong" }
 *   { type: "error",           message }
 */

const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

// ── State ─────────────────────────────────────────────────────────────────────

// Map<userId, { ws, name }>
const _connections = new Map();

// Map<`${userId}-${bookingId}`, timeoutHandle>  — typing debounce timers
const _typingTimers = new Map();
const TYPING_TIMEOUT_MS = 3000;

// ── Server setup ──────────────────────────────────────────────────────────────

/**
 * Attach the WebSocket server to an existing HTTP/HTTPS server.
 * Called once from index.js after the HTTP server is created.
 */
function attachWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    let userId = null;
    let userName = '';

    // Try to authenticate immediately from URL query param token
    // This allows the connection to be authenticated without waiting for auth message
    try {
      const url = new URL(req.url, 'http://localhost');
      const tokenFromUrl = url.searchParams.get('token');
      if (tokenFromUrl) {
        const payload = jwt.verify(tokenFromUrl, process.env.JWT_SECRET || 'your-secret-key');
        userId = payload.userId;
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, username: true },
          });
          userName = user?.fullName || user?.username || `User ${userId}`;
        } catch { userName = `User ${userId}`; }

        const existing = _connections.get(userId);
        if (existing && existing.ws !== ws && existing.ws.readyState === existing.ws.OPEN) {
          existing.ws.close();
        }
        _connections.set(userId, { ws, name: userName });
        _send(ws, { type: 'connected', userId, name: userName });
        _broadcastOnlineStatus(userId, userName, true);

        // Send current online users to the newly connected user
        for (const [connUserId, conn] of _connections) {
          if (connUserId !== userId) {
            _send(ws, { type: 'online', userId: connUserId, name: conn.name, online: true });
          }
        }

        console.log(`🔌 WS: user ${userId} (${userName}) connected via URL token`);
      }
    } catch { /* token from URL invalid or missing — wait for auth message */ }

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); }
      catch { return; }

      // ── auth ────────────────────────────────────────────────────────────
      if (msg.type === 'auth') {
        try {
          const payload = jwt.verify(msg.token, process.env.JWT_SECRET || 'your-secret-key');
          userId = payload.userId;

          try {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { fullName: true, username: true },
            });
            userName = user?.fullName || user?.username || `User ${userId}`;
          } catch { userName = `User ${userId}`; }

          // Close any existing connection for this user (new tab/reconnect)
          const existing = _connections.get(userId);
          if (existing && existing.ws !== ws && existing.ws.readyState === existing.ws.OPEN) {
            existing.ws.close();
          }

          _connections.set(userId, { ws, name: userName });
          _send(ws, { type: 'connected', userId, name: userName });
          _broadcastOnlineStatus(userId, userName, true);

          // Send current online users to the newly connected user
          for (const [connUserId, conn] of _connections) {
            if (connUserId !== userId) {
              _send(ws, { type: 'online', userId: connUserId, name: conn.name, online: true });
            }
          }

          console.log(`🔌 WS: user ${userId} (${userName}) connected`);

        } catch {
          _send(ws, { type: 'error', message: 'Invalid or expired token' });
          ws.close();
        }
        return;
      }

      // All other messages require auth
      if (!userId) {
        _send(ws, { type: 'error', message: 'Not authenticated. Send auth first.' });
        return;
      }

      // ── typing ──────────────────────────────────────────────────────────
      if (msg.type === 'typing') {
        const bookingId = parseInt(msg.bookingId);
        if (!bookingId) return;

        const timerKey = `${userId}-${bookingId}`;

        if (msg.isTyping) {
          _broadcastTypingToOtherParty(bookingId, userId, userName, true);

          // Auto-clear after timeout
          if (_typingTimers.has(timerKey)) clearTimeout(_typingTimers.get(timerKey));
          _typingTimers.set(timerKey, setTimeout(() => {
            _typingTimers.delete(timerKey);
            _broadcastTypingToOtherParty(bookingId, userId, userName, false);
          }, TYPING_TIMEOUT_MS));

        } else {
          if (_typingTimers.has(timerKey)) {
            clearTimeout(_typingTimers.get(timerKey));
            _typingTimers.delete(timerKey);
          }
          _broadcastTypingToOtherParty(bookingId, userId, userName, false);
        }
        return;
      }

      // ── ping/pong ────────────────────────────────────────────────────────
      if (msg.type === 'ping') {
        _send(ws, { type: 'pong' });
        return;
      }
    });

    ws.on('close', () => {
      if (!userId) return;

      // Clear all typing timers for this user
      for (const [key] of _typingTimers) {
        if (key.startsWith(`${userId}-`)) {
          clearTimeout(_typingTimers.get(key));
          _typingTimers.delete(key);
        }
      }

      _connections.delete(userId);
      _broadcastOnlineStatus(userId, userName, false);
      console.log(`🔌 WS: user ${userId} (${userName}) disconnected`);
    });

    ws.on('error', () => { /* handled by close */ });
  });

  console.log('✅ WebSocket server ready on /ws');
  wss.on('error', (err) => console.error('❌ WebSocket server error:', err.message));
  return wss;
}

// ── Public API — called by bookings.service.js ────────────────────────────────

/**
 * Notify the hotel owner about a new booking.
 */
function notifyNewBooking(ownerId, payload) {
  sendToUser(ownerId, { type: 'booking_new', ...payload });
}

/**
 * Notify both client and owner about a booking status change.
 */
function notifyBookingUpdate(booking, message) {
  const clientId = booking.client?.id;
  const ownerId  = booking.hotel?.ownerId;
  const payload = {
    type:          'booking_update',
    bookingId:     booking.bookingId,
    bookingStatus: booking.bookingStatus,
    hotelName:     booking.hotel?.name,
    clientName:    booking.client?.fullName || booking.client?.username,
    message,
    booking,
    timestamp:     new Date().toISOString(),
  };
  if (clientId) sendToUser(clientId, payload);
  if (ownerId && ownerId !== clientId) sendToUser(ownerId, payload);
}

/**
 * Notify the recipient of a new booking message.
 */
function notifyBookingMessage(booking, message, isFromOwner, senderName) {
  const clientId = booking.client?.id;
  const ownerId  = booking.hotel?.ownerId;
  const recipientId = isFromOwner ? clientId : ownerId;
  if (recipientId) {
    sendToUser(recipientId, {
      type:        'booking_message',
      bookingId:   booking.bookingId,
      hotelName:   booking.hotel?.name,
      senderName,
      message,
      isFromOwner,
      booking,
      timestamp:   new Date().toISOString(),
    });
  }
}

/**
 * Send a message to a specific user.
 */
function sendToUser(userId, data) {
  const conn = _connections.get(userId);
  if (conn) _send(conn.ws, data);
}

/**
 * Check if a user is currently connected via WebSocket.
 */
function isUserOnline(userId) {
  return _connections.has(userId);
}

/**
 * Get all currently online user IDs.
 */
function getOnlineUsers() {
  return [..._connections.keys()];
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function _send(ws, data) {
  try {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(data));
  } catch { /* ignore */ }
}

async function _broadcastTypingToOtherParty(bookingId, typingUserId, typingUserName, isTyping) {
  try {
    const booking = await prisma.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotel: true },
    });
    if (!booking) return;

    const clientId = booking.userId;
    const ownerId  = booking.hotel?.ownerId;
    const recipientId = typingUserId === clientId ? ownerId : clientId;

    if (recipientId) {
      sendToUser(recipientId, {
        type: 'typing',
        bookingId,
        userId: typingUserId,
        name: typingUserName,
        isTyping,
      });
    }
  } catch { /* non-fatal */ }
}

function _broadcastOnlineStatus(userId, userName, online) {
  const payload = { type: 'online', userId, name: userName, online };
  for (const [connUserId, conn] of _connections) {
    if (connUserId !== userId) _send(conn.ws, payload);
  }
}

module.exports = {
  attachWebSocketServer,
  notifyNewBooking,
  notifyBookingUpdate,
  notifyBookingMessage,
  sendToUser,
  isUserOnline,
  getOnlineUsers,
};
