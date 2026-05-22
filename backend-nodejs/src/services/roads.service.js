const { roadRepository, tourismRepository } = require('../repositories');
const { toRoadDto, fromRoadDto } = require('../dto/road.dto');

class RoadsService {
  async create(data) {
    const tp = await tourismRepository.findById(parseInt(data.tourismPlaceId));
    if (!tp) throw Object.assign(new Error('Invalid tourism place ID'), { status: 400 });
    const road = await roadRepository.create({ tourismPlaceId: parseInt(data.tourismPlaceId), ...fromRoadDto(data, null) });
    const full = await roadRepository.findById(road.id, { tourismPlace: true });
    return toRoadDto(full);
  }

  async findAll(skip = 0, take = 10, tourismPlaceId) {
    const result = await roadRepository.findAllWithServices(parseInt(skip), parseInt(take), tourismPlaceId);
    return { content: result.data.map(toRoadDto), totalElements: result.total, totalPages: Math.ceil(result.total / parseInt(take)) };
  }

  async findById(id) {
    const road = await roadRepository.findById(id, { tourismPlace: true });
    if (!road) throw Object.assign(new Error('Road not found'), { status: 404 });
    return toRoadDto(road);
  }

  async getByTourism(tourismPlaceId) {
    const roads = await roadRepository.getByTourism(parseInt(tourismPlaceId));
    return roads.map(toRoadDto);
  }

  async getAllByTourism(tourismPlaceId) {
    const roads = await roadRepository.getAllByTourism(parseInt(tourismPlaceId));
    return roads.map(toRoadDto);
  }

  async update(id, data) {
    const road = await roadRepository.findById(id);
    if (!road) throw Object.assign(new Error('Road not found'), { status: 404 });
    const updated = await roadRepository.update(id, fromRoadDto(data, road));
    const full = await roadRepository.findById(id, { tourismPlace: true });
    return toRoadDto(full);
  }

  async remove(id) {
    const road = await roadRepository.findById(id);
    if (!road) throw Object.assign(new Error('Road not found'), { status: 404 });
    await roadRepository.delete(id);
  }

  async toggleActive(id) {
    const road = await roadRepository.findById(id);
    if (!road) throw Object.assign(new Error('Road not found'), { status: 404 });
    const updated = await roadRepository.toggleActive(id);
    const full = await roadRepository.findById(id, { tourismPlace: true });
    return toRoadDto(full);
  }
}

module.exports = new RoadsService();
