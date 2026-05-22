const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

/**
 * Hotel Repository
 * Handles all database operations for Hotel entity
 */
class HotelRepository extends BaseRepository {
  constructor() {
    super(prisma.hotel);
  }

  /**
   * Find all hotels with details
   */
  async findAllWithDetails(skip, take, tourismPlaceId) {
    const where = tourismPlaceId ? { tourismPlaceId: parseInt(tourismPlaceId) } : {};

    return await this.findAll(
      skip,
      take,
      where,
      {
        images: { orderBy: { displayOrder: 'asc' } },
        owner: { select: { id: true, username: true, fullName: true, email: true } },
        tourismPlace: { select: { id: true, name: true } },
        ratings: true,
      },
      { createdAt: 'desc' }
    );
  }

  /**
   * Find hotel by ID with full details
   */
  async findByIdWithDetails(id) {
    return await this.model.findUnique({
      where: { id },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        owner: { select: { id: true, username: true, fullName: true, email: true, active: true } },
        tourismPlace: { select: { id: true, name: true, imageUrl: true } },
        ratings: {
          include: { user: { select: { id: true, username: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          where: { hiddenFromOwner: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  /**
   * Search hotels
   */
  async search(keyword, skip, take) {
    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { description: { contains: keyword, mode: 'insensitive' } },
            { contactInfo: { contains: keyword, mode: 'insensitive' } },
          ],
        }
      : {};

    return await this.findAll(
      skip,
      take,
      where,
      {
        images: true,
        owner: { select: { id: true, username: true, fullName: true } },
        ratings: true,
      }
    );
  }

  /**
   * Get hotels by owner
   */
  async getByOwner(ownerId, skip, take) {
    return await this.findAll(
      skip,
      take,
      { ownerId },
      {
        images: true,
        tourismPlace: { select: { id: true, name: true } },
        ratings: true,
        bookings: { where: { hiddenFromOwner: false } },
      }
    );
  }

  /**
   * Assign owner to hotel
   */
  async assignOwner(hotelId, ownerId) {
    return await this.update(hotelId, { ownerId });
  }

  /**
   * Remove owner from hotel
   */
  async removeOwner(hotelId) {
    return await this.update(hotelId, { ownerId: null });
  }

  /**
   * Toggle hotel active status
   */
  async toggleActive(id) {
    const hotel = await this.findById(id);
    return await this.update(id, { active: !hotel.active });
  }

  /**
   * Get active hotels
   */
  async getActiveHotels(skip, take) {
    return await this.findAll(
      skip,
      take,
      { active: true },
      { images: true, ratings: true }
    );
  }
}

module.exports = new HotelRepository();
