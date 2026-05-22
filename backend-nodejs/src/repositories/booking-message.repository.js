const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

/**
 * Booking Message Repository
 * Handles all database operations for BookingMessage entity
 */
class BookingMessageRepository extends BaseRepository {
  constructor() {
    super(prisma.bookingMessage);
  }

  /**
   * Create message with user details
   */
  async createMessage(data) {
    return await this.create(data);
  }

  /**
   * Get messages by booking
   */
  async getByBooking(bookingId) {
    return await this.findMany(
      { bookingId },
      { user: { select: { id: true, username: true, fullName: true } } },
      { createdAt: 'asc' }
    );
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(bookingId, limit = 10) {
    return await this.model.findMany({
      where: { bookingId },
      include: {
        user: { select: { id: true, username: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

module.exports = new BookingMessageRepository();
