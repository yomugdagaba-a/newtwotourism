const { mapPointRepository } = require('../repositories');

class MapPointsService {
  async create(data) {
    return await mapPointRepository.create(data);
  }

  async findAll(skip = 0, take = 10) {
    const result = await mapPointRepository.findAllWithTourism(parseInt(skip), parseInt(take));
    return { points: result.data, total: result.total };
  }

  async findById(id) {
    const point = await mapPointRepository.findById(id, { tourismPlace: true });
    if (!point) throw Object.assign(new Error('Map point not found'), { status: 404 });
    return point;
  }

  async getByTourism(tourismPlaceId) {
    return await mapPointRepository.getByTourism(parseInt(tourismPlaceId));
  }

  async getByType(type) {
    return await mapPointRepository.getByType(type.toUpperCase());
  }

  async update(id, data) {
    const point = await mapPointRepository.findById(id);
    if (!point) throw Object.assign(new Error('Map point not found'), { status: 404 });
    return await mapPointRepository.update(id, data);
  }

  async remove(id) {
    const point = await mapPointRepository.findById(id);
    if (!point) throw Object.assign(new Error('Map point not found'), { status: 404 });
    return await mapPointRepository.delete(id);
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    return mapPointRepository.calculateDistance(lat1, lon1, lat2, lon2);
  }
}

module.exports = new MapPointsService();
