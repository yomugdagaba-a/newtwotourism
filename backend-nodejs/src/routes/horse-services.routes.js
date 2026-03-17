const router = require('express').Router();
const prisma = require('../lib/prisma');

function mapToDto(s) {
  const ownerMatch = s.description?.match(/Owner:\s*([^,]+)/);
  const contactMatch = s.description?.match(/Contact:\s*([^,]+)/);
  const placeMatch = s.description?.match(/Place:\s*(.+)$/);
  return { id: s.id, ownerName: ownerMatch ? ownerMatch[1].trim() : s.name, contactInfo: contactMatch ? contactMatch[1].trim() : '', initialPlace: placeMatch ? placeMatch[1].trim() : '', cost: s.pricePerHour ? parseFloat(s.pricePerHour.toString()) : 0 };
}

router.get('/roads/:roadId/horse-services', async (req, res, next) => {
  try {
    const services = await prisma.horseService.findMany({ where: { roadInfoId: parseInt(req.params.roadId) } });
    res.json(services.map(mapToDto));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const s = await prisma.horseService.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!s) return res.status(404).json({ message: 'Horse service not found' });
    res.json(mapToDto(s));
  } catch (err) { next(err); }
});

module.exports = router;
