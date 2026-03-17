const prisma = require('../lib/prisma');

const INCLUDE_FULL = { images: true, ratings: { include: { user: true } }, bookings: true, tourismPlace: true };
const INCLUDE_LIST = { images: true, ratings: true };

async function create(data, ownerId) {
  const { images, mainImageUrl, ...rest } = data;
  const hotel = await prisma.hotel.create({ data: { ...rest, ownerId } });
  await _saveImages(hotel.id, mainImageUrl, images);
  return prisma.hotel.findUnique({ where: { id: hotel.id }, include: INCLUDE_FULL });
}

async function findAll(skip = 0, take = 10, tourismPlaceId) {
  const where = tourismPlaceId ? { tourismPlaceId: parseInt(tourismPlaceId) } : {};
  const [hotels, total] = await Promise.all([
    prisma.hotel.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: INCLUDE_LIST }),
    prisma.hotel.count({ where }),
  ]);
  return { hotels, total };
}

async function findById(id) {
  const hotel = await prisma.hotel.findUnique({ where: { id }, include: INCLUDE_FULL });
  if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
  return hotel;
}

async function getByTourism(tourismPlaceId) {
  return prisma.hotel.findMany({ where: { tourismPlaceId }, include: INCLUDE_LIST });
}

async function update(id, data) {
  const hotel = await prisma.hotel.findUnique({ where: { id } });
  if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
  const { images, mainImageUrl, ...rest } = data;
  await prisma.hotel.update({ where: { id }, data: rest });
  if (mainImageUrl !== undefined || images !== undefined) {
    await prisma.hotelImage.deleteMany({ where: { hotelId: id } });
    await _saveImages(id, mainImageUrl, images);
  }
  return prisma.hotel.findUnique({ where: { id }, include: INCLUDE_FULL });
}

async function remove(id) {
  const hotel = await prisma.hotel.findUnique({ where: { id } });
  if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
  return prisma.hotel.delete({ where: { id } });
}

async function search(q = '', skip = 0, take = 10) {
  const where = { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] };
  const [hotels, total] = await Promise.all([
    prisma.hotel.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: INCLUDE_LIST }),
    prisma.hotel.count({ where }),
  ]);
  return { hotels, total };
}

async function getByOwner(ownerId, skip = 0, take = 10) {
  const [hotels, total] = await Promise.all([
    prisma.hotel.findMany({ where: { ownerId }, skip: parseInt(skip), take: parseInt(take), include: INCLUDE_LIST }),
    prisma.hotel.count({ where: { ownerId } }),
  ]);
  return { hotels, total };
}

async function checkUserRating(hotelId, userId) {
  const rating = await prisma.hotelRating.findFirst({ where: { hotelId, userId } });
  return { hasRated: !!rating, rating };
}

async function addImage(hotelId, imageUrl) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
  return prisma.hotelImage.create({ data: { hotelId, imageUrl } });
}

async function removeImage(imageId) {
  return prisma.hotelImage.delete({ where: { id: imageId } });
}

async function assignOwner(hotelId, userId) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
  return prisma.hotel.update({ where: { id: hotelId }, data: { ownerId: userId }, include: INCLUDE_LIST });
}

async function removeOwner(hotelId) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
  return prisma.hotel.update({ where: { id: hotelId }, data: { ownerId: null }, include: INCLUDE_LIST });
}

async function toggleActive(id) {
  const hotel = await prisma.hotel.findUnique({ where: { id } });
  if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });
  return prisma.hotel.update({ where: { id }, data: { active: !hotel.active } });
}

async function _saveImages(hotelId, mainImageUrl, images) {
  const imgs = [];
  if (mainImageUrl?.trim()) imgs.push({ hotelId, imageUrl: mainImageUrl.trim(), displayOrder: 0 });
  if (images?.length) images.forEach((url, i) => { if (url?.trim()) imgs.push({ hotelId, imageUrl: url.trim(), displayOrder: mainImageUrl ? i + 1 : i }); });
  for (const img of imgs) await prisma.hotelImage.create({ data: img });
}

module.exports = { create, findAll, findById, getByTourism, update, remove, search, getByOwner, checkUserRating, addImage, removeImage, assignOwner, removeOwner, toggleActive };
