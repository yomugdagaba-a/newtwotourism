const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class RoadRepository extends BaseRepository {
  constructor() {
    super(prisma.roadInfo);
  }

  async findAllWithServices(skip, take, tourismPlaceId) {
    const where = tourismPlaceId ? { tourismPlaceId: parseInt(tourismPlaceId) } : {};
    return await this.findAll(
      skip, take, where,
      { tourismPlace: { select: { id: true, name: true } }, horseServices: true },
      { createdAt: 'desc' }
    );
  }

  async getByTourism(tourismPlaceId) {
    return await this.findMany(
      { tourismPlaceId, active: true },
      { horseServices: { where: { active: true } } }
    );
  }

  async getAllByTourism(tourismPlaceId) {
    return await this.findMany({ tourismPlaceId }, { horseServices: true });
  }

  async toggleActive(id) {
    const road = await this.findById(id);
    return await this.update(id, { active: !road.active });
  }
}

module.exports = new RoadRepository();
