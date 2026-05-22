const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

/**
 * Map Point Repository
 * Handles all database operations for MapPoint entity
 */
class MapPointRepository extends BaseRepository {
  constructor() {
    super(prisma.mapPoint);
  }

  /**
   * Find all map points with tourism place
   */
  async findAllWithTourism(skip, take) {
    return await this.findAll(
      skip,
      take,
      {},
      { tourismPlace: { select: { id: true, name: true } } },
      { createdAt: 'desc' }
    );
  }

  /**
   * Get map points by tourism place
   */
  async getByTourism(tourismPlaceId) {
    return await this.findMany(
      { tourismPlaceId },
      { tourismPlace: { select: { id: true, name: true } } }
    );
  }

  /**
   * Get map points by type
   */
  async getByType(type) {
    return await this.findMany(
      { type },
      { tourismPlace: { select: { id: true, name: true } } }
    );
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new MapPointRepository();
