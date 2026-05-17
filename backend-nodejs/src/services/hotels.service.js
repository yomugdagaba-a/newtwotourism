const prisma = require('../lib/prisma');

const INCLUDE_FULL = { images: { orderBy: { displayOrder: 'asc' } }, ratings: { include: { user: true } }, bookings: true, tourismPlace: true };
const INCLUDE_LIST = { images: { orderBy: { displayOrder: 'asc' } }, ratings: true };

class HotelsService {
  // ── Private Helpers ────────────────────────────────────────────────────────

  async _saveImages(hotelId, mainImageUrl, images) {
    const imgs = [];
    if (mainImageUrl?.trim()) imgs.push({ hotelId, imageUrl: mainImageUrl.trim(), displayOrder: 0 });
    if (images?.length) {
      images.forEach((url, i) => {
        if (url?.trim()) imgs.push({ hotelId, imageUrl: url.trim(), displayOrder: mainImageUrl ? i + 1 : i });
      });
    }
    for (const img of imgs) await prisma.hotelImage.create({ data: img });
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async create(data, ownerId) {
    const { images, mainImageUrl, ...rest } = data;
    const hotel = await prisma.hotel.create({ data: { ...rest, ownerId } });
    await this._saveImages(hotel.id, mainImageUrl, images);
    return prisma.hotel.findUnique({ where: { id: hotel.id }, include: INCLUDE_FULL });
  }

  async findAll(skip = 0, take = 10, tourismPlaceId, includeInactive = false) {
    const where = tourismPlaceId
      ? { tourismPlaceId: parseInt(tourismPlaceId), ...(includeInactive ? {} : { active: true }) }
      : (includeInactive ? {} : { active: true });
    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: INCLUDE_LIST }),
      prisma.hotel.count({ where }),
    ]);
    const enriched = hotels.map(h => ({ ...h, imageUrl: h.images?.[0]?.imageUrl || null }));
    return { hotels: enriched, total };
  }

  async getAllHotels(skip = 0, take = 10) {
    // Admin endpoint - returns ALL hotels (active and inactive)
    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({ skip: parseInt(skip), take: parseInt(take), include: INCLUDE_LIST }),
      prisma.hotel.count(),
    ]);
    const enriched = hotels.map(h => ({ ...h, imageUrl: h.images?.[0]?.imageUrl || null }));
    return { hotels: enriched, total };
  }

  async findById(id) {
    const hotel = await prisma.hotel.findUnique({ where: { id }, include: INCLUDE_FULL });
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return { ...hotel, imageUrl: hotel.images?.[0]?.imageUrl || null };
  }

  async getByTourism(tourismPlaceId) {
    const hotels = await prisma.hotel.findMany({ where: { tourismPlaceId, active: true }, include: INCLUDE_LIST });
    return hotels.map(h => ({ ...h, imageUrl: h.images?.[0]?.imageUrl || null }));
  }

  async update(id, data) {
    const hotel = await prisma.hotel.findUnique({ where: { id } });
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    const { images, mainImageUrl, imageUrl, ...rest } = data;
    await prisma.hotel.update({ where: { id }, data: rest });

    if (mainImageUrl !== undefined && images !== undefined) {
      // Both provided — full replacement of all images
      await prisma.hotelImage.deleteMany({ where: { hotelId: id } });
      await this._saveImages(id, mainImageUrl, images);
    } else if (mainImageUrl !== undefined) {
      // Only main image — replace displayOrder=0 only, keep gallery intact
      await prisma.hotelImage.deleteMany({ where: { hotelId: id, displayOrder: 0 } });
      if (mainImageUrl.trim()) {
        await prisma.hotelImage.create({ data: { hotelId: id, imageUrl: mainImageUrl.trim(), displayOrder: 0 } });
      }
    } else if (images !== undefined) {
      // Only gallery images — delete non-main images and re-save
      await prisma.hotelImage.deleteMany({ where: { hotelId: id, displayOrder: { gt: 0 } } });
      if (images?.length) {
        images.forEach(async (url, i) => {
          if (url?.trim()) await prisma.hotelImage.create({ data: { hotelId: id, imageUrl: url.trim(), displayOrder: i + 1 } });
        });
      }
    }

    return prisma.hotel.findUnique({ where: { id }, include: INCLUDE_FULL });
  }

  async remove(id) {
    const hotel = await prisma.hotel.findUnique({ where: { id } });
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return prisma.hotel.delete({ where: { id } });
  }

  async search(q = '', skip = 0, take = 10) {
    const where = { active: true, OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] };
    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: INCLUDE_LIST }),
      prisma.hotel.count({ where }),
    ]);
    return { hotels, total };
  }

  async getByOwner(ownerId, skip = 0, take = 10) {
    const [hotels, total] = await Promise.all([
      prisma.hotel.findMany({ where: { ownerId }, skip: parseInt(skip), take: parseInt(take), include: INCLUDE_LIST }),
      prisma.hotel.count({ where: { ownerId } }),
    ]);
    return { hotels, total };
  }

  // ── Image Management ───────────────────────────────────────────────────────

  async checkUserRating(hotelId, userId) {
    const rating = await prisma.hotelRating.findFirst({ where: { hotelId, userId } });
    return { hasRated: !!rating, rating };
  }

  async addImage(hotelId, imageUrl) {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return prisma.hotelImage.create({ data: { hotelId, imageUrl } });
  }

  async updateImage(imageId, data) {
    return prisma.hotelImage.update({ where: { id: imageId }, data });
  }

  async removeImage(imageId) {
    return prisma.hotelImage.delete({ where: { id: imageId } });
  }

  async setMainImage(hotelId, imageUrl) {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId }, include: { images: true } });
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    
    // Find the image that should become main
    const targetImage = hotel.images.find(img => img.imageUrl === imageUrl);
    if (!targetImage) throw Object.assign(new Error('Image not found'), { status: 404 });
    
    // Get current main image (displayOrder = 0)
    const currentMain = hotel.images.find(img => img.displayOrder === 0);
    
    // Update target image to displayOrder 0
    await prisma.hotelImage.update({
      where: { id: targetImage.id },
      data: { displayOrder: 0 }
    });
    
    // If there was a previous main image, move it to gallery
    if (currentMain && currentMain.id !== targetImage.id) {
      await prisma.hotelImage.update({
        where: { id: currentMain.id },
        data: { displayOrder: hotel.images.length }
      });
    }
    
    return prisma.hotel.findUnique({ where: { id: hotelId }, include: { images: true } });
  }

  // ── Owner Management ───────────────────────────────────────────────────────

  async assignOwner(hotelId, userId) {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return prisma.hotel.update({ where: { id: hotelId }, data: { ownerId: userId }, include: INCLUDE_LIST });
  }

  async removeOwner(hotelId) {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return prisma.hotel.update({ where: { id: hotelId }, data: { ownerId: null }, include: INCLUDE_LIST });
  }

  async toggleActive(id) {
    const hotel = await prisma.hotel.findUnique({ where: { id } });
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return prisma.hotel.update({ where: { id }, data: { active: !hotel.active } });
  }
}

module.exports = new HotelsService();
