const prisma = require('../lib/prisma');

class MapPointsService {
  async create(data) {
    return prisma.mapPoint.create({ data });
  }

  async findAll(skip = 0, take = 10) {
    const [points, total] = await Promise.all([
      prisma.mapPoint.findMany({ skip: parseInt(skip), take: parseInt(take), include: { tourismPlace: true } }),
      prisma.mapPoint.count(),
    ]);
    return { points, total };
  }

  async findById(id) {
    const point = await prisma.mapPoint.findUnique({ where: { id }, include: { tourismPlace: true } });
    if (!point) throw Object.assign(new Error('Map point not found'), { status: 404 });
    return point;
  }

  async getByTourism(tourismPlaceId) {
    return prisma.mapPoint.findMany({ where: { tourismPlaceId: parseInt(tourismPlaceId) } });
  }

  async getByType(type) {
    return prisma.mapPoint.findMany({ where: { type: type.toUpperCase() } });
  }

  async update(id, data) {
    const point = await prisma.mapPoint.findUnique({ where: { id } });
    if (!point) throw Object.assign(new Error('Map point not found'), { status: 404 });
    return prisma.mapPoint.update({ where: { id }, data });
  }

  async remove(id) {
    const point = await prisma.mapPoint.findUnique({ where: { id } });
    if (!point) throw Object.assign(new Error('Map point not found'), { status: 404 });
    return prisma.mapPoint.delete({ where: { id } });
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

module.exports = new MapPointsService();
