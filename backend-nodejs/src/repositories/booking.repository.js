const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

/**
 * Booking Repository
 * Handles all database operations for HotelBooking entity
 */
class BookingRepository extends BaseRepository {
  constructor() {
    super(prisma.hotelBooking);
  }

  /**
   * Find all bookings with details
   */
  async findAllWithDetails(skip, take, hotelId, userId) {
    const where = {};
    if (hotelId) where.hotelId = parseInt(hotelId);
    if (userId) where.userId = parseInt(userId);

    return await this.findAll(
      skip,
      take,
      where,
      {
        hotel: {
          select: {
            id: true,
            name: true,
            contactInfo: true,
            owner: { select: { id: true, username: true, fullName: true, email: true } },
          },
        },
        user: { select: { id: true, username: true, fullName: true, email: true } },
        status: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
      { createdAt: 'desc' }
    );
  }

  /**
   * Find booking by ID with full details
   */
  async findByIdWithDetails(id) {
    return await this.model.findUnique({
      where: { id },
      include: {
        hotel: {
          include: {
            owner: { select: { id: true, username: true, fullName: true, email: true } },
            images: { take: 1, orderBy: { displayOrder: 'asc' } },
          },
        },
        user: { select: { id: true, username: true, fullName: true, email: true } },
        status: true,
        messages: {
          include: { user: { select: { id: true, username: true, fullName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Get bookings by user
   */
  async getByUser(userId) {
    return await this.findMany(
      { userId, hiddenFromClient: false },
      {
        hotel: {
          select: {
            id: true,
            name: true,
            contactInfo: true,
            images: { take: 1, orderBy: { displayOrder: 'asc' } },
          },
        },
        status: true,
        messages: true,
      },
      { createdAt: 'desc' }
    );
  }

  /**
   * Get bookings by hotel
   */
  async getByHotel(hotelId, skip, take) {
    return await this.findAll(
      skip,
      take,
      { hotelId, hiddenFromOwner: false },
      {
        user: { select: { id: true, username: true, fullName: true, email: true } },
        status: true,
        messages: true,
      },
      { createdAt: 'desc' }
    );
  }

  /**
   * Get bookings by owner
   */
  async getByOwner(ownerId) {
    return await this.model.findMany({
      where: {
        hotel: { ownerId },
        hiddenFromOwner: false,
      },
      include: {
        hotel: { select: { id: true, name: true } },
        user: { select: { id: true, username: true, fullName: true, email: true } },
        status: true,
        messages: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get recent bookings
   */
  async getRecentBookings(take = 10) {
    return await this.model.findMany({
      take,
      include: {
        hotel: { select: { id: true, name: true } },
        user: { select: { id: true, username: true, fullName: true } },
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get bookings by status
   */
  async getByStatus(statusId) {
    return await this.findMany(
      { statusId },
      {
        hotel: { select: { id: true, name: true } },
        user: { select: { id: true, username: true, fullName: true } },
        status: true,
      },
      { createdAt: 'desc' }
    );
  }

  /**
   * Get problem bookings
   */
  async getProblemBookings() {
    return await this.findMany(
      { problemReported: true },
      {
        hotel: { select: { id: true, name: true, owner: true } },
        user: { select: { id: true, username: true, fullName: true, email: true } },
        status: true,
      },
      { createdAt: 'desc' }
    );
  }

  /**
   * Update booking status
   */
  async updateStatus(id, statusId) {
    return await this.update(id, { statusId });
  }

  /**
   * Report problem
   */
  async reportProblem(id, problemReport) {
    return await this.update(id, {
      problemReported: true,
      problemReport,
    });
  }

  /**
   * Hide from client
   */
  async hideFromClient(id) {
    return await this.update(id, { hiddenFromClient: true });
  }

  /**
   * Hide from owner
   */
  async hideFromOwner(id) {
    return await this.update(id, { hiddenFromOwner: true });
  }
}

module.exports = new BookingRepository();
