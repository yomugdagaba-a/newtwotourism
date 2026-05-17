const prisma = require('../lib/prisma');
const { toRoadDto, fromRoadDto } = require('../dto/road.dto');

const INCLUDE = { tourismPlace: true };

class RoadsService {
  async create(data) {
    const tp = await prisma.tourismPlace.findUnique({ where: { id: parseInt(data.tourismPlaceId) } });
    if (!tp) throw Object.assign(new Error('Invalid tourism place ID'), { status: 400 });
    const road = await prisma.roadInfo.create({
      data: { tourismPlaceId: parseInt(data.tourismPlaceId), ...fromRoadDto(data, null) },
      include: INCLUDE,
    });
    return toRoadDto(road);
  }

  async findAll(skip = 0, take = 10, tourismPlaceId) {
    const where = tourismPlaceId ? { tourismPlaceId: parseInt(tourismPlaceId) } : {};
    const [roads, total] = await Promise.all([
      prisma.roadInfo.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: INCLUDE }),
      prisma.roadInfo.count({ where }),
    ]);
    return { content: roads.map(toRoadDto), totalElements: total, totalPages: Math.ceil(total / parseInt(take)) };
  }

  async findById(id) {
    const road = await prisma.roadInfo.findUnique({ where: { id }, include: INCLUDE });
    if (!road) throw Object.assign(new Error('Road not found'), { status: 404 });
    return toRoadDto(road);
  }

  async getByTourism(tourismPlaceId) {
    const roads = await prisma.roadInfo.findMany({ where: { tourismPlaceId: parseInt(tourismPlaceId), active: true }, include: INCLUDE });
    return roads.map(toRoadDto);
  }

  async getAllByTourism(tourismPlaceId) {
    // Admin endpoint - shows all roads (active and inactive)
    const roads = await prisma.roadInfo.findMany({ where: { tourismPlaceId: parseInt(tourismPlaceId) }, include: INCLUDE });
    return roads.map(toRoadDto);
  }

  async update(id, data) {
    const road = await prisma.roadInfo.findUnique({ where: { id } });
    if (!road) throw Object.assign(new Error('Road not found'), { status: 404 });
    const updated = await prisma.roadInfo.update({ where: { id }, data: fromRoadDto(data, road), include: INCLUDE });
    return toRoadDto(updated);
  }

  async remove(id) {
    const road = await prisma.roadInfo.findUnique({ where: { id } });
    if (!road) throw Object.assign(new Error('Road not found'), { status: 404 });
    await prisma.roadInfo.delete({ where: { id } });
  }

  async toggleActive(id) {
    const road = await prisma.roadInfo.findUnique({ where: { id } });
    if (!road) throw Object.assign(new Error('Road not found'), { status: 404 });
    const updated = await prisma.roadInfo.update({
      where: { id },
      data: { active: !road.active },
      include: INCLUDE,
    });
    return toRoadDto(updated);
  }
}

module.exports = new RoadsService();
