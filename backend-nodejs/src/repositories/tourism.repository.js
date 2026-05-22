const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

/**
 * Tourism Place Repository
 * Handles all database operations for TourismPlace entity
 */
class TourismRepository extends BaseRepository {
  constructor() {
    super(prisma.tourismPlace);
  }

  /**
   * Find all tourism places with images
   */
  async findAllWithImages(skip, take, category) {
    const where = category ? { categories: { has: category } } : {};

    return await this.findAll(
      skip,
      take,
      where,
      {
        images: { orderBy: { displayOrder: 'asc' } },
        ratings: true,
      },
      { createdAt: 'desc' }
    );
  }

  /**
   * Find tourism place by ID with full details
   */
  async findByIdWithDetails(id) {
    return await this.model.findUnique({
      where: { id },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        hotels: {
          where: { active: true },
          include: { images: true },
        },
        ratings: {
          include: { user: { select: { id: true, username: true, fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        roadInfos: {
          where: { active: true },
          include: { horseServices: { where: { active: true } } },
        },
        languageGuiders: { where: { active: true } },
        mapPoints: true,
      },
    });
  }

  /**
   * Search tourism places
   */
  async search(keyword, category, skip, take) {
    const where = {
      AND: [
        category ? { categories: { has: category } } : {},
        keyword
          ? {
              OR: [
                { name: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
                { wereda: { contains: keyword, mode: 'insensitive' } },
                { kebele: { contains: keyword, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    return await this.findAll(
      skip,
      take,
      where,
      { images: true, ratings: true },
      { viewersCount: 'desc' }
    );
  }

  /**
   * Get nearby places
   */
  async getNearbyPlaces(latitude, longitude, limit = 5) {
    // Simple implementation - in production, use PostGIS or similar
    return await this.model.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
        ],
      },
      include: {
        images: { take: 1, orderBy: { displayOrder: 'asc' } },
      },
      take: limit,
    });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id) {
    return await this.model.update({
      where: { id },
      data: { viewersCount: { increment: 1 } },
    });
  }

  /**
   * Get tourism places by category
   */
  async getByCategory(category, skip, take) {
    return await this.findAll(
      skip,
      take,
      { categories: { has: category } },
      { images: true, ratings: true }
    );
  }
}

module.exports = new TourismRepository();
