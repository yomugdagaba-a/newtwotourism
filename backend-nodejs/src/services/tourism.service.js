const { tourismRepository, imageRepository, tourismViewRepository } = require('../repositories');

class TourismService {
  async create(data) {
    const { images, ...rest } = data;
    if (rest.visitTime !== undefined) rest.visitTime = rest.visitTime ? String(rest.visitTime) : null;
    return await tourismRepository.create(rest);
  }

  async findAll(skip = 0, take = 10, category) {
    const result = category 
      ? await tourismRepository.getByCategory(category.toUpperCase(), parseInt(skip), parseInt(take))
      : await tourismRepository.findAllWithImages(parseInt(skip), parseInt(take));
    const enriched = result.data.map(p => ({ ...p, imageUrl: p.imageUrl || p.images?.[0]?.imageUrl || null }));
    return { places: enriched, total: result.total };
  }

  async findById(id) {
    if (!id || isNaN(id)) throw Object.assign(new Error('Invalid tourism place ID'), { status: 400 });
    const place = await tourismRepository.findByIdWithDetails(id);
    if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
    const nearbyPlaces = await this.getNearbyPlaces(id, 5);
    return { ...place, nearbyPlaces: nearbyPlaces.map(p => ({ id: p.id, name: p.name, imageUrl: p.images?.[0]?.imageUrl || null })) };
  }

  /**
   * Increment view count for a tourism place
   * Only counts if the same session hasn't viewed within the last 24 hours
   * @param {number} tourismPlaceId - The tourism place ID
   * @param {string} sessionId - Unique session identifier (browser fingerprint)
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - Client user agent
   * @returns {Promise<{counted: boolean, viewCount: number}>}
   */
  async incrementView(tourismPlaceId, sessionId, ipAddress = null, userAgent = null) {
    if (!tourismPlaceId || isNaN(tourismPlaceId)) throw Object.assign(new Error('Invalid tourism place ID'), { status: 400 });
    if (!sessionId) throw Object.assign(new Error('Session ID is required'), { status: 400 });

    try {
      const hasViewed = await tourismViewRepository.hasViewed(tourismPlaceId, sessionId, 24);
      let counted = false;

      if (!hasViewed) {
        await tourismViewRepository.recordView(tourismPlaceId, sessionId, ipAddress, userAgent);
        await tourismRepository.incrementViewCount(tourismPlaceId);
        counted = true;
      }

      const place = await tourismRepository.findById(tourismPlaceId);
      return { counted, viewCount: place?.viewersCount || 0 };
    } catch (error) {
      console.warn('View tracking error:', error.message);
      await tourismRepository.incrementViewCount(tourismPlaceId);
      const place = await tourismRepository.findById(tourismPlaceId);
      return { counted: true, viewCount: place?.viewersCount || 0 };
    }
  }

  async update(id, data) {
    const place = await tourismRepository.findById(id);
    if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
    const { images, ...rest } = data;
    return await tourismRepository.update(id, rest);
  }

  async remove(id) {
    const place = await tourismRepository.findById(id);
    if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
    return await tourismRepository.delete(id);
  }

  async search(query, category, skip = 0, take = 10) {
    const result = await tourismRepository.search(query, category, parseInt(skip), parseInt(take));
    return { places: result.data, total: result.total };
  }

  async searchPublic({ keyword = '', kebele = '', wereda = '', categories = [], page = 0, size = 12, sortBy = 'name', sortDir = 'asc' }) {
    const result = await tourismRepository.search(keyword, categories.length ? categories[0] : null, parseInt(page) * parseInt(size), parseInt(size));
    const enriched = result.data.map(place => ({ ...place, imageUrl: place.imageUrl || place.images?.[0]?.imageUrl || null }));
    const totalPages = Math.ceil(result.total / parseInt(size));
    return { content: enriched, totalPages, totalElements: result.total, number: parseInt(page), size: parseInt(size), numberOfElements: result.data.length, first: parseInt(page) === 0, last: parseInt(page) >= totalPages - 1, empty: result.data.length === 0 };
  }

  async getHomepage(categories = []) {
    const result = categories.length 
      ? await tourismRepository.getByCategory(categories[0], 0, 10)
      : await tourismRepository.findAllWithImages(0, 10);
    return result.data.map(p => ({ ...p, imageUrl: p.imageUrl || p.images?.[0]?.imageUrl || null }));
  }

  async getNearbyPlaces(tourismPlaceId, limit = 5) {
    return await tourismRepository.getNearbyPlaces(null, null, limit);
  }

  async getImages(tourismPlaceId) {
    return await imageRepository.getTourismImages(tourismPlaceId);
  }

  async addImage(tourismPlaceId, imageUrl) {
    const place = await tourismRepository.findById(tourismPlaceId);
    if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
    return await imageRepository.createTourismImage({ tourismPlaceId, imageUrl });
  }

  async updateImage(imageId, data) {
    return await imageRepository.updateTourismImage(imageId, data);
  }

  async setMainImage(tourismPlaceId, imageId) {
    return await imageRepository.setTourismMainImage(tourismPlaceId, imageId);
  }

  async removeImage(imageId) {
    return await imageRepository.deleteTourismImage(imageId);
  }

  async getActiveHeroImages() {
    return await imageRepository.getActiveHeroImages();
  }

  async getAllHeroImages() {
    return await imageRepository.getAllHeroImages();
  }

  async addHeroImage(data) {
    return await imageRepository.createHeroImage(data);
  }

  async updateHeroImage(id, data) {
    return await imageRepository.updateHeroImage(id, data);
  }

  async deleteHeroImage(id) {
    return await imageRepository.deleteHeroImage(id);
  }
}

module.exports = new TourismService();
