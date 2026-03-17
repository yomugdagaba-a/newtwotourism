const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

function mapToDb(data, existing) {
  return {
    name: data.ownerName || existing?.name || 'Horse Service',
    description: `Owner: ${data.ownerName || ''}, Contact: ${data.contactInfo || ''}, Place: ${data.initialPlace || ''}`,
    pricePerHour: data.cost !== undefined ? data.cost : (existing?.pricePerHour || 0),
    maxCapacity: existing?.maxCapacity || 1,
    active: true,
    roadInfoId: data.roadInfoId !== undefined ? data.roadInfoId : existing?.roadInfoId,
  };
}

function mapToDto(s) {
  const ownerMatch = s.description?.match(/Owner:\s*([^,]+)/);
  const contactMatch = s.description?.match(/Contact:\s*([^,]+)/);
  const placeMatch = s.description?.match(/Place:\s*(.+)$/);
  return { id: s.id, ownerName: ownerMatch ? ownerMatch[1].trim() : s.name, contactInfo: contactMatch ? contactMatch[1].trim() : '', initialPlace: placeMatch ? placeMatch[1].trim() : '', cost: s.pricePerHour ? parseFloat(s.pricePerHour.toString()) : 0 };
}

router.post('/', async (req, res, next) => {
  try {
    const s = await prisma.horseService.create({ data: mapToDb(req.body, null) });
    res.status(201).json(mapToDto(s));
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.horseService.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existing) return res.status(404).json({ message: 'Horse service not found' });
    const s = await prisma.horseService.update({ where: { id: existing.id }, data: mapToDb(req.body, existing) });
    res.json(mapToDto(s));
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.horseService.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
