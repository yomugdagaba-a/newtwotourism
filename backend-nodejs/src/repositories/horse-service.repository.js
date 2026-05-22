const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

/**
 * Horse Service Repository
 * Handles all database operations for HorseService entity
 */
class HorseServiceRepository extends BaseRepository {
  constructor() {
    super(prisma.horseService);
  }

  /**
   * Find all horse services with road info
   */
  async findAllWithRoad(skip, take) {
    return await this.findAll(
      skip,
      take,
      {},
      { roadInfo: { include: { tourismPlace: true } } },
      { createdAt: 'desc' }
    );
  }

  /**
   * Get active horse services by road
   */
  async getByRoad(roadId) {
    return await this.findMany({ roadInfoId: roadId, active: true }, { roadInfo: true });
  }

  /**
   * Toggle horse service active status
   */
  async toggleActive(id) {
    const service = await this.findById(id);
    return await this.update(id, { active: !service.active });
  }
}

module.exports = new HorseServiceRepository();
