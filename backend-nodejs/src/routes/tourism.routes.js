const router = require('express').Router();
const prisma = require('../lib/prisma');

// GET /api/tourisms/public/search
router.get('/public/search', async (req, res, next) => {
  try {
    const { keyword = '', kebele = '', wereda = '', categories, page = 0, size = 12, sortBy = 'name', sortDir = 'asc' } = req.query;
    const p = parseInt(page), s = parseInt(size);
    const cats = categories ? (Array.isArray(categories) ? categories : [categories]) : [];
    const and = [{ status: 'ACTIVE' }];
    if (keyword.trim()) and.push({ OR: [{ name: { contains: keyword.trim(), mode: 'insensitive' } }, { description: { contains: keyword.trim(), mode: 'insensitive' } }] });
    if (kebele.trim()) and.push({ kebele: { contains: kebele.trim(), mode: 'insensitive' } });
    if (wereda.trim()) and.push({ wereda: { contains: wereda.trim(), mode: 'insensitive' } });
    const validCats = ['HERITAGE', 'HIGHLAND', 'CAVERN', 'AQUATICS', 'CULTURE', 'MODERN'];
    const filteredCats = cats.filter(c => validCats.includes(c.toUpperCase())).map(c => c.toUpperCase());
    if (filteredCats.length) and.push({ categories: { hasSome: filteredCats } });
    const where = { AND: and };
    const orderBy = { [sortBy === 'viewersCount' ? 'viewersCount' : sortBy]: sortDir === 'desc' ? 'desc' : 'asc' };
    const [content, totalElements] = await Promise.all([
      prisma.tourismPlace.findMany({ where, skip: p * s, take: s, include: { images: true, ratings: true }, orderBy }),
      prisma.tourismPlace.count({ where }),
    ]);
    const totalPages = Math.ceil(totalElements / s);
    res.json({ content, totalPages, totalElements, number: p, size: s, numberOfElements: content.length, first: p === 0, last: p >= totalPages - 1, empty: content.length === 0 });
  } catch (err) { next(err); }
});

// GET /api/tourisms/public/homepage
router.get('/public/homepage', async (req, res, next) => {
  try {
    const { categories } = req.query;
    const cats = categories ? (Array.isArray(categories) ? categories : [categories]) : [];
    const where = cats.length ? { categories: { hasSome: cats } } : {};
    const places = await prisma.tourismPlace.findMany({ where, take: 10, orderBy: { viewersCount: 'desc' }, include: { images: true } });
    res.json(places);
  } catch (err) { next(err); }
});

// GET /api/tourisms/health
router.get('/health', (req, res) => res.json({ status: 'UP' }));

// GET /api/tourisms/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });
    const place = await prisma.tourismPlace.findUnique({ where: { id }, include: { images: true, ratings: { include: { user: true } }, hotels: true, roadInfos: true } });
    if (!place) return res.status(404).json({ message: 'Tourism place not found' });
    await prisma.tourismPlace.update({ where: { id }, data: { viewersCount: { increment: 1 } } });
    const nearbyPlaces = await prisma.tourismPlace.findMany({ where: { kebele: place.kebele, id: { not: id }, status: 'ACTIVE' }, include: { images: true }, take: 5 });
    res.json({ ...place, nearbyPlaces: nearbyPlaces.map(p => ({ id: p.id, name: p.name, imageUrl: p.images?.[0]?.imageUrl || null })) });
  } catch (err) { next(err); }
});

module.exports = router;
