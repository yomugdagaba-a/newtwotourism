const prisma = require('../lib/prisma');

/**
 * Image Repository
 * Handles all database operations for image entities
 */
class ImageRepository {
  constructor() {
    this.tourismImage = prisma.tourismImage;
    this.hotelImage = prisma.hotelImage;
    this.heroImage = prisma.heroImage;
  }

  async deleteMany(where) {
    return await this.hotelImage.deleteMany({ where });
  }

  // ========== Tourism Image Operations ==========

  async createTourismImage(data) {
    return await this.tourismImage.create({ data });
  }

  async getTourismImages(tourismPlaceId) {
    return await this.tourismImage.findMany({
      where: { tourismPlaceId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateTourismImage(id, data) {
    return await this.tourismImage.update({
      where: { id },
      data,
    });
  }

  async deleteTourismImage(id) {
    return await this.tourismImage.delete({ where: { id } });
  }

  async setTourismMainImage(tourismPlaceId, imageId) {
    // Set all images to non-main
    await this.tourismImage.updateMany({
      where: { tourismPlaceId },
      data: { displayOrder: 1 },
    });

    // Set selected image as main
    return await this.tourismImage.update({
      where: { id: imageId },
      data: { displayOrder: 0 },
    });
  }

  // ========== Hotel Image Operations ==========

  async createHotelImage(data) {
    return await this.hotelImage.create({ data });
  }

  async getHotelImages(hotelId) {
    return await this.hotelImage.findMany({
      where: { hotelId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateHotelImage(id, data) {
    return await this.hotelImage.update({
      where: { id },
      data,
    });
  }

  async deleteHotelImage(id) {
    return await this.hotelImage.delete({ where: { id } });
  }

  async setHotelMainImage(hotelId, imageId) {
    // Set all images to non-main
    await this.hotelImage.updateMany({
      where: { hotelId },
      data: { displayOrder: 1 },
    });

    // Set selected image as main
    return await this.hotelImage.update({
      where: { id: imageId },
      data: { displayOrder: 0 },
    });
  }

  // ========== Hero Image Operations ==========

  async createHeroImage(data) {
    return await this.heroImage.create({ data });
  }

  async getAllHeroImages() {
    return await this.heroImage.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getActiveHeroImages() {
    return await this.heroImage.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async updateHeroImage(id, data) {
    return await this.heroImage.update({
      where: { id },
      data,
    });
  }

  async deleteHeroImage(id) {
    return await this.heroImage.delete({ where: { id } });
  }
}

module.exports = new ImageRepository();
