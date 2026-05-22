const { hotelRepository, imageRepository } = require('../repositories');

class HotelsService {
  async _saveImages(hotelId, mainImageUrl, images) {
    if (mainImageUrl?.trim()) {
      await imageRepository.createHotelImage({ hotelId, imageUrl: mainImageUrl.trim(), displayOrder: 0 });
    }
    if (images?.length) {
      for (let i = 0; i < images.length; i++) {
        if (images[i]?.trim()) {
          await imageRepository.createHotelImage({ hotelId, imageUrl: images[i].trim(), displayOrder: mainImageUrl ? i + 1 : i });
        }
      }
    }
  }

  async create(data, ownerId) {
    const { images, mainImageUrl, ...rest } = data;
    const hotel = await hotelRepository.create({ ...rest, ownerId });
    await this._saveImages(hotel.id, mainImageUrl, images);
    return await hotelRepository.findByIdWithDetails(hotel.id);
  }

  async findAll(skip = 0, take = 10, tourismPlaceId) {
    const result = await hotelRepository.findAllWithDetails(parseInt(skip), parseInt(take), tourismPlaceId);
    const enriched = result.data.map(h => ({ ...h, imageUrl: h.images?.[0]?.imageUrl || null }));
    return { hotels: enriched, total: result.total };
  }

  async getAllHotels(skip = 0, take = 10) {
    const result = await hotelRepository.findAll(parseInt(skip), parseInt(take), {}, { images: true, ratings: true });
    const enriched = result.data.map(h => ({ ...h, imageUrl: h.images?.[0]?.imageUrl || null }));
    return { hotels: enriched, total: result.total };
  }

  async findById(id) {
    const hotel = await hotelRepository.findByIdWithDetails(id);
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return { ...hotel, imageUrl: hotel.images?.[0]?.imageUrl || null };
  }

  async getByTourism(tourismPlaceId) {
    const result = await hotelRepository.findAll(0, 100, { tourismPlaceId, active: true }, { images: true, ratings: true });
    return result.data.map(h => ({ ...h, imageUrl: h.images?.[0]?.imageUrl || null }));
  }

  async update(id, data) {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    const { images, mainImageUrl, imageUrl, ...rest } = data;
    await hotelRepository.update(id, rest);

    if (mainImageUrl !== undefined && images !== undefined) {
      await imageRepository.deleteMany({ hotelId: id });
      await this._saveImages(id, mainImageUrl, images);
    } else if (mainImageUrl !== undefined) {
      await imageRepository.deleteMany({ hotelId: id, displayOrder: 0 });
      if (mainImageUrl.trim()) {
        await imageRepository.createHotelImage({ hotelId: id, imageUrl: mainImageUrl.trim(), displayOrder: 0 });
      }
    } else if (images !== undefined) {
      await imageRepository.deleteMany({ hotelId: id, displayOrder: { gt: 0 } });
      for (let i = 0; i < images.length; i++) {
        if (images[i]?.trim()) {
          await imageRepository.createHotelImage({ hotelId: id, imageUrl: images[i].trim(), displayOrder: i + 1 });
        }
      }
    }

    return await hotelRepository.findByIdWithDetails(id);
  }

  async remove(id) {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return await hotelRepository.delete(id);
  }

  async search(q = '', skip = 0, take = 10) {
    const result = await hotelRepository.search(q, parseInt(skip), parseInt(take));
    return { hotels: result.data, total: result.total };
  }

  async getByOwner(ownerId, skip = 0, take = 10) {
    return await hotelRepository.getByOwner(parseInt(ownerId), parseInt(skip), parseInt(take));
  }

  async checkUserRating(hotelId, userId) {
    const { ratingRepository } = require('../repositories');
    const rating = await ratingRepository.checkHotelRating(hotelId, userId);
    return { hasRated: !!rating, rating };
  }

  async addImage(hotelId, imageUrl) {
    const hotel = await hotelRepository.findById(hotelId);
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return await imageRepository.createHotelImage({ hotelId, imageUrl });
  }

  async updateImage(imageId, data) {
    return await imageRepository.updateHotelImage(imageId, data);
  }

  async removeImage(imageId) {
    return await imageRepository.deleteHotelImage(imageId);
  }

  async setMainImage(hotelId, imageUrl) {
    const hotel = await hotelRepository.findByIdWithDetails(hotelId);
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    const targetImage = hotel.images.find(img => img.imageUrl === imageUrl);
    if (!targetImage) throw Object.assign(new Error('Image not found'), { status: 404 });
    return await imageRepository.setHotelMainImage(hotelId, targetImage.id);
  }

  async assignOwner(hotelId, userId) {
    const hotel = await hotelRepository.findById(hotelId);
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return await hotelRepository.assignOwner(hotelId, userId);
  }

  async removeOwner(hotelId) {
    const hotel = await hotelRepository.findById(hotelId);
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return await hotelRepository.removeOwner(hotelId);
  }

  async toggleActive(id) {
    const hotel = await hotelRepository.findById(id);
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    return await hotelRepository.toggleActive(id);
  }
}

module.exports = new HotelsService();
