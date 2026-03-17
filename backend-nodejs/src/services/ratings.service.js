const prisma = require('../lib/prisma');

function calcSummary(ratings) {
  if (!ratings.length) return { averageRating: 0, totalRatings: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });
  return { averageRating: parseFloat(avg.toFixed(2)), totalRatings: ratings.length, distribution };
}

async function rateTourism(tourismPlaceId, userId, rating, comment) {
  if (rating < 1 || rating > 5) throw Object.assign(new Error('Rating must be between 1 and 5'), { status: 400 });
  const place = await prisma.tourismPlace.findUnique({ where: { id: tourismPlaceId } });
  if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
  return prisma.tourismRating.upsert({
    where: { tourismPlaceId_userId: { tourismPlaceId, userId } },
    update: { rating, comment }, create: { tourismPlaceId, userId, rating, comment },
    include: { user: true },
  });
}

async function rateHotel(hotelId, userId, rating, comment) {
  if (rating < 1 || rating > 5) throw Object.assign(new Error('Rating must be between 1 and 5'), { status: 400 });
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
  return prisma.hotelRating.upsert({
    where: { hotelId_userId: { hotelId, userId } },
    update: { rating, comment }, create: { hotelId, userId, rating, comment },
    include: { user: true },
  });
}

async function getTourismRatings(tourismPlaceId, skip = 0, take = 10) {
  const ratings = await prisma.tourismRating.findMany({ where: { tourismPlaceId }, skip: parseInt(skip), take: parseInt(take), include: { user: true } });
  return ratings;
}

async function getHotelRatings(hotelId, skip = 0, take = 10) {
  const ratings = await prisma.hotelRating.findMany({ where: { hotelId }, skip: parseInt(skip), take: parseInt(take), include: { user: true } });
  return ratings;
}

async function getTourismRatingSummary(tourismPlaceId) {
  const ratings = await prisma.tourismRating.findMany({ where: { tourismPlaceId } });
  return calcSummary(ratings);
}

async function getHotelRatingSummary(hotelId) {
  const ratings = await prisma.hotelRating.findMany({ where: { hotelId } });
  return calcSummary(ratings);
}

module.exports = { rateTourism, rateHotel, getTourismRatings, getHotelRatings, getTourismRatingSummary, getHotelRatingSummary };
