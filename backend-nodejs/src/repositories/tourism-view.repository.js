const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

/**
 * Tourism View Repository
 * Handles all database operations for TourismView entity
 */
class TourismViewRepository extends BaseRepository {
  constructor() {
    super(prisma.tourismView);
  }

  /**
   * Record a view
   */
  async recordView(tourismPlaceId, sessionId, ipAddress, userAgent) {
    return await this.create({
      tourismPlaceId,
      sessionId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Check if session already viewed
   */
  async hasViewed(tourismPlaceId, sessionId, hours = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    const view = await this.model.findFirst({
      where: {
        tourismPlaceId,
        sessionId,
        viewedAt: { gte: cutoffTime },
      },
    });

    return !!view;
  }

  /**
   * Get view count for tourism place
   */
  async getViewCount(tourismPlaceId) {
    return await this.count({ tourismPlaceId });
  }

  /**
   * Get unique view count (by session)
   */
  async getUniqueViewCount(tourismPlaceId) {
    const views = await this.model.findMany({
      where: { tourismPlaceId },
      select: { sessionId: true },
      distinct: ['sessionId'],
    });

    return views.length;
  }
}

module.exports = new TourismViewRepository();
