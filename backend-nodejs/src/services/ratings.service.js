const { ratingRepository, tourismRepository, hotelRepository } = require('../repositories');

class RatingsService {
  _calcSummary(ratings) {
    if (!ratings.length) return { averageRating: 0, totalRatings: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });
    return { averageRating: parseFloat(avg.toFixed(2)), totalRatings: ratings.length, distribution };
  }

  async rateTourism(tourismPlaceId, userId, rating, comment) {
    if (rating < 1 || rating > 5) throw Object.assign(new Error('Rating must be between 1 and 5'), { status: 400 });
    const place = await tourismRepository.findById(tourismPlaceId);
    if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
    const existing = await ratingRepository.checkTourismRating(tourismPlaceId, userId);
    if (existing) {
      return await ratingRepository.updateTourismRating(tourismPlaceId, userId, rating, comment);
    }
    return await ratingRepository.createTourismRating({ tourismPlaceId, userId, rating, comment });
  }

  async rateHotel(hotelId, userId, rating, comment) {
    if (rating < 1 || rating > 5) throw Object.assign(new Error('Rating must be between 1 and 5'), { status: 400 });
    const hotel = await hotelRepository.findById(hotelId);
    if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
    const existing = await ratingRepository.checkHotelRating(hotelId, userId);
    if (existing) {
      return await ratingRepository.updateHotelRating(hotelId, userId, rating, comment);
    }
    return await ratingRepository.createHotelRating({ hotelId, userId, rating, comment });
  }

  async getTourismRatings(tourismPlaceId, skip = 0, take = 10) {
    const result = await ratingRepository.getTourismRatings(tourismPlaceId, parseInt(skip), parseInt(take));
    return result.ratings;
  }

  async getHotelRatings(hotelId, skip = 0, take = 10) {
    const result = await ratingRepository.getHotelRatings(hotelId, parseInt(skip), parseInt(take));
    return result.ratings;
  }

  async getTourismRatingSummary(tourismPlaceId) {
    return await ratingRepository.getTourismRatingSummary(tourismPlaceId);
  }

  async getHotelRatingSummary(hotelId) {
    return await ratingRepository.getHotelRatingSummary(hotelId);
  }
}

module.exports = new RatingsService();
