const { languageGuiderRepository } = require('../repositories');

class LanguageGuidersService {
  async create(data) {
    return await languageGuiderRepository.create(data);
  }

  async findAll(skip = 0, take = 10) {
    const result = await languageGuiderRepository.findAllWithTourism(parseInt(skip), parseInt(take));
    return { guiders: result.data, total: result.total };
  }

  async findById(id) {
    const g = await languageGuiderRepository.findById(id);
    if (!g) throw Object.assign(new Error('Language guider not found'), { status: 404 });
    return g;
  }

  async update(id, data) {
    const g = await languageGuiderRepository.findById(id);
    if (!g) throw Object.assign(new Error('Language guider not found'), { status: 404 });
    return await languageGuiderRepository.update(id, data);
  }

  async remove(id) {
    const g = await languageGuiderRepository.findById(id);
    if (!g) throw Object.assign(new Error('Language guider not found'), { status: 404 });
    return await languageGuiderRepository.delete(id);
  }

  async findByLanguage(language) {
    return await languageGuiderRepository.findByLanguage(language);
  }

  async findByTourismPlace(tourismPlaceId) {
    return await languageGuiderRepository.findByTourismPlace(parseInt(tourismPlaceId));
  }

  async findAllByTourismPlace(tourismPlaceId) {
    return await languageGuiderRepository.findMany({ tourismPlaceId: parseInt(tourismPlaceId) });
  }

  async toggleActive(id) {
    const guider = await languageGuiderRepository.findById(id);
    if (!guider) throw Object.assign(new Error('Language guider not found'), { status: 404 });
    return await languageGuiderRepository.toggleActive(id);
  }
}

module.exports = new LanguageGuidersService();
