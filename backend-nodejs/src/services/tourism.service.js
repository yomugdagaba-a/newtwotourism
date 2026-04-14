const prisma = require('../lib/prisma');

const INCLUDE_FULL = { images: true, ratings: { include: { user: true } }, hotels: true, roadInfos: true };
const INCLUDE_LIST = { images: true, ratings: true };

async function create(data) {
  const { images, ...rest } = data;
  if (rest.visitTime !== undefined) rest.visitTime = rest.visitTime ? String(rest.visitTime) : null;
  return prisma.tourismPlace.create({ data: rest, include: INCLUDE_LIST });
}

async function findAll(skip = 0, take = 10, category) {
  const where = category ? { categories: { has: category.toUpperCase() } } : {};
  const [places, total] = await Promise.all([
    prisma.tourismPlace.findMany({ where, skip: parseInt(skip), take: parseInt(take), include: INCLUDE_LIST }),
    prisma.tourismPlace.count({ where }),
  ]);
  return { places, total };
}

async function findById(id) {
  if (!id || isNaN(id)) throw Object.assign(new Error('Invalid tourism place ID'), { status: 400 });
  const place = await prisma.tourismPlace.findUnique({ where: { id }, include: INCLUDE_FULL });
  if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
  await prisma.tourismPlace.update({ where: { id }, data: { viewersCount: { increment: 1 } } });
  const nearbyPlaces = await getNearbyPlaces(id, 5);
  return { ...place, nearbyPlaces: nearbyPlaces.map(p => ({ id: p.id, name: p.name, imageUrl: p.images?.[0]?.imageUrl || null })) };
}

async function update(id, data) {
  const place = await prisma.tourismPlace.findUnique({ where: { id } });
  if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
  const { images, ...rest } = data;
  return prisma.tourismPlace.update({ where: { id }, data: rest, include: INCLUDE_LIST });
}

async function remove(id) {
  const place = await prisma.tourismPlace.findUnique({ where: { id } });
  if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
  return prisma.tourismPlace.delete({ where: { id } });
}

async function search(query, category, skip = 0, take = 10) {
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

async function searchPublic({ keyword = '', kebele = '', wereda = '', categories = [], page = 0, size = 12, sortBy = 'name', sortDir = 'asc' }) {
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
  const totalPages = Math.ceil(totalElements / s);
  return { content, totalPages, totalElements, number: p, size: s, numberOfElements: content.length, first: p === 0, last: p >= totalPages - 1, empty: content.length === 0 };
}

async function getHomepage(categories = []) {
  const where = categories.length ? { categories: { hasSome: categories } } : {};
  return prisma.tourismPlace.findMany({ where, take: 10, orderBy: { viewersCount: 'desc' }, include: { images: true } });
}

async function getImages(tourismPlaceId) {
  return prisma.tourismImage.findMany({ where: { tourismPlaceId } });
}

async function getNearbyPlaces(tourismPlaceId, limit = 5) {
  const place = await prisma.tourismPlace.findUnique({ where: { id: tourismPlaceId } });
  if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
  return prisma.tourismPlace.findMany({ where: { kebele: place.kebele, id: { not: tourismPlaceId }, status: 'ACTIVE' }, include: { images: true }, take: limit });
}

async function addImage(tourismPlaceId, imageUrl) {
  const place = await prisma.tourismPlace.findUnique({ where: { id: tourismPlaceId } });
  if (!place) throw Object.assign(new Error('Tourism place not found'), { status: 404 });
  return prisma.tourismImage.create({ data: { tourismPlaceId, imageUrl } });
}

async function updateImage(imageId, data) {
  const image = await prisma.tourismImage.findUnique({ where: { id: imageId } });
  if (!image) throw Object.assign(new Error('Image not found'), { status: 404 });
  const { imageUrl, displayOrder } = data;
  return prisma.tourismImage.update({ where: { id: imageId }, data: { ...(imageUrl && { imageUrl }), ...(displayOrder !== undefined && { displayOrder }) } });
}

async function setMainImage(tourismPlaceId, imageId) {
  // Schema has no isMain field — set displayOrder=0 for main, increment others
  const images = await prisma.tourismImage.findMany({ where: { tourismPlaceId }, orderBy: { displayOrder: 'asc' } });
  const others = images.filter(img => img.id !== imageId);
  await prisma.tourismImage.update({ where: { id: imageId }, data: { displayOrder: 0 } });
  for (let i = 0; i < others.length; i++) {
    await prisma.tourismImage.update({ where: { id: others[i].id }, data: { displayOrder: i + 1 } });
  }
  return prisma.tourismImage.findUnique({ where: { id: imageId } });
}

async function removeImage(imageId) {
  return prisma.tourismImage.delete({ where: { id: imageId } });
}

// ── Hero Images ────────────────────────────────────────────────────────────────
async function getActiveHeroImages() {
  return prisma.heroImage.findMany({ where: { active: true }, orderBy: { displayOrder: 'asc' } });
}

async function getAllHeroImages() {
  return prisma.heroImage.findMany({ orderBy: { displayOrder: 'asc' } });
}

async function addHeroImage(data) {
  const { imageUrl, title, description, displayOrder, active } = data;
  return prisma.heroImage.create({ data: { imageUrl, title, description, displayOrder: displayOrder ?? 0, active: active !== false } });
}

async function updateHeroImage(id, data) {
  const img = await prisma.heroImage.findUnique({ where: { id } });
  if (!img) throw Object.assign(new Error('Hero image not found'), { status: 404 });
  const { imageUrl, title, description, displayOrder, active } = data;
  return prisma.heroImage.update({ where: { id }, data: { ...(imageUrl !== undefined && { imageUrl }), ...(title !== undefined && { title }), ...(description !== undefined && { description }), ...(displayOrder !== undefined && { displayOrder }), ...(active !== undefined && { active }) } });
}

async function deleteHeroImage(id) {
  const img = await prisma.heroImage.findUnique({ where: { id } });
  if (!img) throw Object.assign(new Error('Hero image not found'), { status: 404 });
  return prisma.heroImage.delete({ where: { id } });
}

module.exports = { create, findAll, findById, update, remove, search, searchPublic, getHomepage, getImages, getNearbyPlaces, addImage, updateImage, setMainImage, removeImage, getActiveHeroImages, getAllHeroImages, addHeroImage, updateHeroImage, deleteHeroImage };
