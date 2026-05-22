const { horseServiceRepository } = require('../repositories');

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
    const s = await horseServiceRepository.create(this._toDb(data, null));
    return this._toDto(s);
  }

  async findAll(skip = 0, take = 10) {
    const result = await horseServiceRepository.findAll(parseInt(skip), parseInt(take));
    return { services: result.data.map(s => this._toDto(s)), total: result.total };
  }

  async findById(id) {
    const s = await horseServiceRepository.findById(id);
    if (!s) throw Object.assign(new Error('Horse service not found'), { status: 404 });
    return this._toDto(s);
  }

  async getByRoad(roadId) {
    const services = await horseServiceRepository.getByRoad(parseInt(roadId));
    return services.map(s => this._toDto(s));
  }

  async getAllByRoad(roadId) {
    const services = await horseServiceRepository.findMany({ roadInfoId: parseInt(roadId) });
    return services.map(s => this._toDto(s));
  }

  async update(id, data) {
    const existing = await horseServiceRepository.findById(id);
    if (!existing) throw Object.assign(new Error('Horse service not found'), { status: 404 });
    const s = await horseServiceRepository.update(id, this._toDb(data, existing));
    return this._toDto(s);
  }

  async remove(id) {
    const existing = await horseServiceRepository.findById(id);
    if (!existing) throw Object.assign(new Error('Horse service not found'), { status: 404 });
    await horseServiceRepository.delete(id);
  }

  async toggleActive(id) {
    const service = await horseServiceRepository.findById(id);
    if (!service) throw Object.assign(new Error('Horse service not found'), { status: 404 });
    const updated = await horseServiceRepository.toggleActive(id);
    return this._toDto(updated);
  }
}

module.exports = new HorseServicesService();
