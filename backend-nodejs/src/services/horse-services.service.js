const prisma = require('../lib/prisma');

class HorseServicesService {
  _toDto(s) {
    const ownerMatch = s.description?.match(/Owner:\s*([^,]+)/);
    const contactMatch = s.description?.match(/Contact:\s*([^,]+)/);
    const placeMatch = s.description?.match(/Place:\s*(.+)$/);
    return {
      id: s.id,
      ownerName: ownerMatch ? ownerMatch[1].trim() : s.name,
      contactInfo: contactMatch ? contactMatch[1].trim() : '',
      initialPlace: placeMatch ? placeMatch[1].trim() : '',
      cost: s.pricePerHour ? parseFloat(s.pricePerHour.toString()) : 0,
      roadInfoId: s.roadInfoId,
      active: s.active !== undefined ? s.active : true,
      createdAt: s.createdAt ? s.createdAt.toISOString() : undefined,
    };
  }

  _toDb(data, existing) {
    return {
      name: data.ownerName || existing?.name || 'Horse Service',
      description: `Owner: ${data.ownerName || ''}, Contact: ${data.contactInfo || ''}, Place: ${data.initialPlace || ''}`,
      pricePerHour: data.cost !== undefined ? data.cost : (existing?.pricePerHour || 0),
      maxCapacity: existing?.maxCapacity || 1,
      active: true,
      roadInfoId: data.roadInfoId !== undefined ? data.roadInfoId : existing?.roadInfoId,
    };
  }

  async create(data) {
    const s = await prisma.horseService.create({ data: this._toDb(data, null) });
    return this._toDto(s);
  }

  async findAll(skip = 0, take = 10) {
    const [services, total] = await Promise.all([
      prisma.horseService.findMany({ skip: parseInt(skip), take: parseInt(take) }),
      prisma.horseService.count(),
    ]);
    return { services: services.map(s => this._toDto(s)), total };
  }

  async findById(id) {
    const s = await prisma.horseService.findUnique({ where: { id } });
    if (!s) throw Object.assign(new Error('Horse service not found'), { status: 404 });
    return this._toDto(s);
  }

  async getByRoad(roadId) {
    const services = await prisma.horseService.findMany({ where: { roadInfoId: parseInt(roadId), active: true } });
    return services.map(s => this._toDto(s));
  }

  async getAllByRoad(roadId) {
    // Admin endpoint - shows all horse services (active and inactive)
    const services = await prisma.horseService.findMany({ where: { roadInfoId: parseInt(roadId) } });
    return services.map(s => this._toDto(s));
  }

  async update(id, data) {
    const existing = await prisma.horseService.findUnique({ where: { id } });
    if (!existing) throw Object.assign(new Error('Horse service not found'), { status: 404 });
    const s = await prisma.horseService.update({ where: { id }, data: this._toDb(data, existing) });
    return this._toDto(s);
  }

  async remove(id) {
    const existing = await prisma.horseService.findUnique({ where: { id } });
    if (!existing) throw Object.assign(new Error('Horse service not found'), { status: 404 });
    await prisma.horseService.delete({ where: { id } });
  }

  async toggleActive(id) {
    const service = await prisma.horseService.findUnique({ where: { id } });
    if (!service) throw Object.assign(new Error('Horse service not found'), { status: 404 });
    const updated = await prisma.horseService.update({
      where: { id },
      data: { active: !service.active },
    });
    return this._toDto(updated);
  }
}

module.exports = new HorseServicesService();
