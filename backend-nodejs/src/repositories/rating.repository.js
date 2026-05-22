const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

/**
 * Rating Repository
 * Handles all database operations for Rating entities
 */
class RatingRepository {
  constructor() {
    this.tourismRating = prisma.tourismRating;
    this.hotelRating = prisma.hotelRating;
  }

  // ========== Tourism Rating Operations ==========

  /**
   * Create tourism rating
   */
  async createTourismRating(data) {
    return await this.tourismRating.create({ data });
  }

  /**
   * Get tourism ratings
   */
  async getTourismRatings(tourismPlaceId, skip, take) {
    const [ratings, total] = await Promise.all([
      this.tourismRating.findMany({
        where: { tourismPlaceId },
        include: {
          user: { select: { id: true, username: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.tourismRating.count({ where: { tourismPlaceId } }),
    ]);

    return { ratings, total };
  }

  /**
   * Get tourism rating summary
   */
  async getTourismRatingSummary(tourismPlaceId) {
    const ratings = await this.tourismRating.findMany({
      where: { tourismPlaceId },
      select: { rating: true },
    });

    if (ratings.length === 0) {
      return { average: 0, count: 0, distribution: {} };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    const distribution = ratings.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {});

    return { average, count: ratings.length, distribution };
  }

  /**
   * Check if user rated tourism place
   */
  async checkTourismRating(tourismPlaceId, userId) {
    return await this.tourismRating.findUnique({
      where: {
        tourismPlaceId_userId: { tourismPlaceId, userId },
      },
    });
  }

  /**
   * Update tourism rating
   */
  async updateTourismRating(tourismPlaceId, userId, rating, comment) {
    return await this.tourismRating.update({
      where: {
        tourismPlaceId_userId: { tourismPlaceId, userId },
      },
      data: { rating, comment },
    });
  }

  // ========== Hotel Rating Operations ==========

  /**
   * Create hotel rating
   */
  async createHotelRating(data) {
    return await this.hotelRating.create({ data });
  }

  /**
   * Get hotel ratings
   */
  async getHotelRatings(hotelId, skip, take) {
    const [ratings, total] = await Promise.all([
      this.hotelRating.findMany({
        where: { hotelId },
        include: {
          user: { select: { id: true, username: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.hotelRating.count({ where: { hotelId } }),
    ]);

    return { ratings, total };
  }

  /**
   * Get hotel rating summary
   */
  async getHotelRatingSummary(hotelId) {
    const ratings = await this.hotelRating.findMany({
      where: { hotelId },
      select: { rating: true },
    });

    if (ratings.length === 0) {
      return { average: 0, count: 0, distribution: {} };
    }

    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / ratings.length;

    const distribution = ratings.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {});

    return { average, count: ratings.length, distribution };
  }

  /**
   * Check if user rated hotel
   */
  async checkHotelRating(hotelId, userId) {
    return await this.hotelRating.findUnique({
      where: {
        hotelId_userId: { hotelId, userId },
      },
    });
  }

  /**
   * Update hotel rating
   */
  async updateHotelRating(hotelId, userId, rating, comment) {
    return await this.hotelRating.update({
      where: {
        hotelId_userId: { hotelId, userId },
      },
      data: { rating, comment },
    });
  }
}

module.exports = new RatingRepository();
