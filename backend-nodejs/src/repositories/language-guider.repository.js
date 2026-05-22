const prisma = require('../lib/prisma');
const BaseRepository = require('./base.repository');

class LanguageGuiderRepository extends BaseRepository {
  constructor() {
    super(prisma.languageGuider);
  }

  async findAllWithTourism(skip, take) {
    return await this.findAll(
      skip, take, {},
      { tourismPlace: { select: { id: true, name: true } } },
      { createdAt: 'desc' }
    );
  }

  async findByLanguage(language) {
    return await this.model.findMany({
      where: { languages: { has: language }, active: true },
      include: { tourismPlace: { select: { id: true, name: true } } },
    });
  }

  async findByTourismPlace(tourismPlaceId) {
    return await this.findMany(
      { tourismPlaceId, active: true },
      { tourismPlace: { select: { id: true, name: true } } }
    );
  }

  async toggleActive(id) {
    const guider = await this.findById(id);
    return await this.update(id, { active: !guider.active });
  }
}

module.exports = new LanguageGuiderRepository();
