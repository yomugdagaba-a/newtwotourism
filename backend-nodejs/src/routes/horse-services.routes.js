const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

function mapToDto(s) {
  const ownerMatch = s.description?.match(/Owner:\s*([^,]+)/);
  const contactMatch = s.description?.match(/Contact:\s*([^,]+)/);
  const placeMatch = s.description?.match(/Place:\s*(.+)$/);
  return {
    id: s.id,
    ownerName: ownerMatch ? ownerMatch[1].trim() : s.name,
    contactInfo: contactMatch ? contactMatch[1].trim() : '',
    initialPlace: placeMatch ? placeMatch[1].trim() : '',
    cost: s.pricePerHour ? parseFloat(s.pricePerHour.toString()) : 0,
    roadInfoId: s.roadInfoId,
  };
}

// GET /api/horse-services
router.get('/', async (req, res, next) => {
  try {
    const { skip = 0, take = 10 } = req.query;
    const [services, total] = await Promise.all([
      prisma.horseService.findMany({ skip: parseInt(skip), take: parseInt(take) }),
      prisma.horseService.count(),
    ]);
    res.json({ services: services.map(mapToDto), total });
  } catch (err) { next(err); }
});

// GET /api/horse-services/:id
router.get('/:id', async (req, res, next) => {
  try {
    const s = await prisma.horseService.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!s) return res.status(404).json({ message: 'Horse service not found' });
    res.json(mapToDto(s));
  } catch (err) { next(err); }
});

// POST /api/horse-services
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { ownerName, contactInfo, initialPlace, cost, roadInfoId } = req.body;
    const s = await prisma.horseService.create({
      data: {
        name: ownerName || 'Horse Service',
        description: `Owner: ${ownerName || ''}, Contact: ${contactInfo || ''}, Place: ${initialPlace || ''}`,
        pricePerHour: cost || 0,
        maxCapacity: 1,
        active: true,
        roadInfoId: roadInfoId || null,
      },
    });
    res.status(201).json(mapToDto(s));
  } catch (err) { next(err); }
});

// PUT /api/horse-services/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await prisma.horseService.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return res.status(404).json({ message: 'Horse service not found' });
    const { ownerName, contactInfo, initialPlace, cost, roadInfoId } = req.body;
    const s = await prisma.horseService.update({
      where: { id: existing.id },
      data: {
        name: ownerName || existing.name,
        description: `Owner: ${ownerName || ''}, Contact: ${contactInfo || ''}, Place: ${initialPlace || ''}`,
        pricePerHour: cost !== undefined ? cost : existing.pricePerHour,
        roadInfoId: roadInfoId !== undefined ? roadInfoId : existing.roadInfoId,
      },
    });
    res.json(mapToDto(s));
  } catch (err) { next(err); }
});

// DELETE /api/horse-services/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.horseService.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
