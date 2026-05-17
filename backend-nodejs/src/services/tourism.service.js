const prisma = require('../lib/prisma');

const INCLUDE_FULL = { images: true, ratings: { include: { user: true } }, hotels: true, roadInfos: true };
const INCLUDE_LIST = { images: true, ratings: true };

class TourismService {
  // ── CRUD ───────────────────────────────────────────────────────────────────

  async create(data) {
    const { images, ...rest } = data;
    if (rest.visitTime !== undefined) rest.visitTime = rest.visitTime ? String(rest.visitTime) : null;
    return prisma.tourismPlace.create({ data: rest, include: INCLUDE_LIST });
  }

  async findAll(skip = 0, take = 10, category) {
    const where = category ? { categories: { has: category.toUpperCase() } } : {};
    const [places, total] = await Promise.all([
      prisma.tourismPlace.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: INCLUDE_LIST }),
      prisma.tourismPlace.count({ where }),
    ]);
    const enriched = places.map(p => ({ ...p, imageUrl: p.imageUrl || p.images?.[0]?.imageUrl || null }));
    return { places: enriched, total };
  }

  async findById(id) {
    if (!id || isNaN(id)) throw Object.assign(new Error('Invalid tourism place ID'), { status: 400 });
    const place = await prisma.tourismPlace.findUnique({ where: { id }, include: INCLUDE_FULL });
    if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
    // Note: View counting is now handled by incrementView() method
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
    if (!tourismPlaceId || isNaN(tourismPlaceId)) {
      throw Object.assign(new Error('Invalid tourism place ID'), { status: 400 });
    }
    if (!sessionId) {
      throw Object.assign(new Error('Session ID is required'), { status: 400 });
    }

    try {
      // Check if this session has viewed this place in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentView = await prisma.tourismView.findFirst({
        where: {
          tourismPlaceId,
          sessionId,
          viewedAt: { gte: twentyFourHoursAgo }
        }
      });

      let counted = false;
      if (!recentView) {
        // Record the view
        await prisma.tourismView.create({
          data: {
            tourismPlaceId,
            sessionId,
            ipAddress,
            userAgent
          }
        });

        // Increment the counter
        await prisma.tourismPlace.update({
          where: { id: tourismPlaceId },
          data: { viewersCount: { increment: 1 } }
        });

        counted = true;
      }

      // Get current view count
      const place = await prisma.tourismPlace.findUnique({
        where: { id: tourismPlaceId },
        select: { viewersCount: true }
      });

      return {
        counted,
        viewCount: place?.viewersCount || 0
      };
    } catch (error) {
      // If TourismView table doesn't exist, just increment the counter
      console.warn('TourismView table not found, incrementing counter only:', error.message);
      
      await prisma.tourismPlace.update({
        where: { id: tourismPlaceId },
        data: { viewersCount: { increment: 1 } }
      });

      const place = await prisma.tourismPlace.findUnique({
        where: { id: tourismPlaceId },
        select: { viewersCount: true }
      });

      return {
        counted: true,
        viewCount: place?.viewersCount || 0
      };
    }
  }

  async update(id, data) {
    const place = await prisma.tourismPlace.findUnique({ where: { id } });
    if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
    const { images, ...rest } = data;
    return prisma.tourismPlace.update({ where: { id }, data: rest, include: INCLUDE_LIST });
  }

  async remove(id) {
    const place = await prisma.tourismPlace.findUnique({ where: { id } });
    if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
    return prisma.tourismPlace.delete({ where: { id } });
  }

  async search(query, category, skip = 0, take = 10) {
    const where = {
      AND: [
        { OR: [{ name: { contains: query, mode: 'insensitive' } }, { description: { contains: query, mode: 'insensitive' } }] },
        category ? { categories: { has: category.toUpperCase() } } : {},
      ],
    };
    const [places, total] = await Promise.all([
      prisma.tourismPlace.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: INCLUDE_LIST }),
      prisma.tourismPlace.count({ where }),
    ]);
    return { places, total };
  }

  async searchPublic({ keyword = '', kebele = '', wereda = '', categories = [], page = 0, size = 12, sortBy = 'name', sortDir = 'asc' }) {
    const p = parseInt(page), s = parseInt(size);
    const and = [{ status: 'ACTIVE' }];
    if (keyword.trim()) and.push({ OR: [{ name: { contains: keyword.trim(), mode: 'insensitive' } }, { description: { contains: keyword.trim(), mode: 'insensitive' } }] });
    if (kebele.trim()) and.push({ kebele: { contains: kebele.trim(), mode: 'insensitive' } });
    if (wereda.trim()) and.push({ wereda: { contains: wereda.trim(), mode: 'insensitive' } });
    const validCats = ['HERITAGE', 'HIGHLAND', 'CAVERN', 'AQUATICS', 'CULTURE', 'MODERN'];
    const filteredCats = categories.filter(c => validCats.includes(c.toUpperCase())).map(c => c.toUpperCase());
    if (filteredCats.length) and.push({ categories: { hasSome: filteredCats } });
    const where = { AND: and };
    const orderBy = { [sortBy === 'viewersCount' ? 'viewersCount' : sortBy]: sortDir === 'desc' ? 'desc' : 'asc' };
    const [content, totalElements] = await Promise.all([
      prisma.tourismPlace.findMany({ where, skip: p * s, take: s, include: INCLUDE_LIST, orderBy }),
      prisma.tourismPlace.count({ where }),
    ]);
    const enriched = content.map(place => ({ ...place, imageUrl: place.imageUrl || place.images?.[0]?.imageUrl || null }));
    const totalPages = Math.ceil(totalElements / s);
    return { content: enriched, totalPages, totalElements, number: p, size: s, numberOfElements: content.length, first: p === 0, last: p >= totalPages - 1, empty: content.length === 0 };
  }

  async getHomepage(categories = []) {
    const where = categories.length ? { categories: { hasSome: categories } } : {};
    const places = await prisma.tourismPlace.findMany({ where, take: 10, orderBy: { viewersCount: 'desc' }, include: { images: true } });
    return places.map(p => ({ ...p, imageUrl: p.imageUrl || p.images?.[0]?.imageUrl || null }));
  }

  // ── Nearby ─────────────────────────────────────────────────────────────────

  async getNearbyPlaces(tourismPlaceId, limit = 5) {
    const place = await prisma.tourismPlace.findUnique({ where: { id: tourismPlaceId } });
    if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
    return prisma.tourismPlace.findMany({ where: { kebele: place.kebele, id: { not: tourismPlaceId }, status: 'ACTIVE' }, include: { images: true }, take: limit });
  }

  // ── Image Management ───────────────────────────────────────────────────────

  async getImages(tourismPlaceId) {
    return prisma.tourismImage.findMany({ where: { tourismPlaceId } });
  }

  async addImage(tourismPlaceId, imageUrl) {
    const place = await prisma.tourismPlace.findUnique({ where: { id: tourismPlaceId } });
    if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
    return prisma.tourismImage.create({ data: { tourismPlaceId, imageUrl } });
  }

  async updateImage(imageId, data) {
    const image = await prisma.tourismImage.findUnique({ where: { id: imageId } });
    if (!image) throw Object.assign(new Error('Image not found'), { status: 404 });
    const { imageUrl, displayOrder } = data;
    return prisma.tourismImage.update({ where: { id: imageId }, data: { ...(imageUrl && { imageUrl }), ...(displayOrder !== undefined && { displayOrder }) } });
  }

  async setMainImage(tourismPlaceId, imageId) {
    const images = await prisma.tourismImage.findMany({ where: { tourismPlaceId }, orderBy: { displayOrder: 'asc' } });
    const others = images.filter(img => img.id !== imageId);
    await prisma.tourismImage.update({ where: { id: imageId }, data: { displayOrder: 0 } });
    for (let i = 0; i < others.length; i++) {
      await prisma.tourismImage.update({ where: { id: others[i].id }, data: { displayOrder: i + 1 } });
    }
    return prisma.tourismImage.findUnique({ where: { id: imageId } });
  }

  async removeImage(imageId) {
    return prisma.tourismImage.delete({ where: { id: imageId } });
  }

  // ── Hero Images ────────────────────────────────────────────────────────────

  async getActiveHeroImages() {
    return prisma.heroImage.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' } });
  }

  async getAllHeroImages() {
    return prisma.heroImage.findMany({ orderBy: { displayOrder: 'asc' } });
  }

  async addHeroImage(data) {
    const { imageUrl, title, description, displayOrder, active } = data;
    return prisma.heroImage.create({ data: { imageUrl, title, description, displayOrder: displayOrder ?? 0, active: active !== false } });
  }

  async updateHeroImage(id, data) {
    const img = await prisma.heroImage.findUnique({ where: { id } });
    if (!img) throw Object.assign(new Error('Hero image not found'), { status: 404 });
    const { imageUrl, title, description, displayOrder, active } = data;
    return prisma.heroImage.update({ where: { id }, data: { ...(imageUrl !== undefined && { imageUrl }), ...(title !== undefined && { title }), ...(description !== undefined && { description }), ...(displayOrder !== undefined && { displayOrder }), ...(active !== undefined && { active }) } });
  }

  async deleteHeroImage(id) {
    const img = await prisma.heroImage.findUnique({ where: { id } });
    if (!img) throw Object.assign(new Error('Hero image not found'), { status: 404 });
    return prisma.heroImage.delete({ where: { id } });
  }
}

module.exports = new TourismService();
