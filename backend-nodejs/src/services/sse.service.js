/**
 * SSE (Server-Sent Events) Service
 *
 * Manages persistent SSE connections per user.
 * When a booking action happens, the service pushes an event to the
 * affected users (client and/or owner) so their browser updates instantly.
 *
 * Design:
 *  - One Map: userId (number) → Set of response objects
 *    (a user can have multiple tabs open)
 *  - Events are fire-and-forget; if a connection is dead it is cleaned up
 *  - No external dependency — pure Node.js HTTP streams
 */

class SseService {
  constructor() {
    // Map<userId, Set<res>>
    this._clients = new Map();
  }

  // ── Connection management ─────────────────────────────────────────────────

  /**
   * Register a new SSE connection for a user.
   * Sets the correct SSE headers and sends an initial "connected" event.
   * Returns a cleanup function that removes the connection.
   */
  addClient(userId, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.flushHeaders();

    // Send initial connected event
    this._write(res, 'connected', { userId, message: 'SSE connection established' });

    // Keep-alive ping every 25 seconds to prevent proxy timeouts
    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(heartbeat);
      }
    }, 25000);

    // Register
    if (!this._clients.has(userId)) {
      this._clients.set(userId, new Set());
    }
    this._clients.get(userId).add(res);

    console.log(`📡 SSE: user ${userId} connected (${this._clients.get(userId).size} connections)`);

    // Cleanup on disconnect
    const cleanup = () => {
      clearInterval(heartbeat);
      const set = this._clients.get(userId);
      if (set) {
        set.delete(res);
        if (set.size === 0) this._clients.delete(userId);
      }
      console.log(`📡 SSE: user ${userId} disconnected`);
    };

    res.on('close', cleanup);
    res.on('error', cleanup);

    return cleanup;
  }

  // ── Event broadcasting ────────────────────────────────────────────────────

  /**
   * Send a booking event to one or more users.
   * @param {number[]} userIds  - list of user IDs to notify
   * @param {string}   event    - event name (e.g. 'booking_update')
   * @param {object}   payload  - data to send
   */
  sendToUsers(userIds, event, payload) {
    for (const userId of userIds) {
      const connections = this._clients.get(userId);
      if (!connections || connections.size === 0) continue;

      for (const res of connections) {
        try {
          this._write(res, event, payload);
        } catch (err) {
          console.error(`📡 SSE: failed to write to user ${userId}:`, err.message);
          connections.delete(res);
        }
      }
    }
  }

  /**
   * Notify both the booking client and the hotel owner about a booking change.
   * @param {object} booking  - transformed booking object from bookings.service
   * @param {string} event    - event name
   * @param {string} message  - human-readable notification message
   */
  notifyBookingUpdate(booking, event, message) {
    const clientId = booking.client?.id;
    const ownerId  = booking.hotel?.ownerId;

    const payload = {
      bookingId:     booking.bookingId,
      bookingStatus: booking.bookingStatus,
      hotelName:     booking.hotel?.name,
      clientName:    booking.client?.fullName || booking.client?.username,
      message,
      booking,       // full booking so frontend can update state directly
      timestamp:     new Date().toISOString(),
    };

    const targets = [...new Set([clientId, ownerId].filter(Boolean))];
    this.sendToUsers(targets, event, payload);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  _write(res, event, data) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /** How many users are currently connected */
  get connectedCount() {
    return this._clients.size;
  }
}

// Singleton — shared across the whole process
module.exports = new SseService();
