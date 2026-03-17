const prisma = require('../lib/prisma');

function toDto(s) {
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

function toDb(data, existing) {
  return {
    name: data.ownerName || existing?.name || 'Horse Service',
    description: `Owner: ${data.ownerName || ''}, Contact: ${data.contactInfo || ''}, Place: ${data.initialPlace || ''}`,
    pricePerHour: data.cost !== undefined ? data.cost : (existing?.pricePerHour || 0),
    maxCapacity: existing?.maxCapacity || 1,
    active: true,
    roadInfoId: data.roadInfoId !== undefined ? data.roadInfoId : existing?.roadInfoId,
  };
}

async function create(data) {
  const s = await prisma.horseService.create({ data: toDb(data, null) });
  return toDto(s);
}

async function findAll(skip = 0, take = 10) {
  const [services, total] = await Promise.all([
    prisma.horseService.findMany({ skip: parseInt(skip), take: parseInt(take) }),
    prisma.horseService.count(),
  ]);
  return { services: services.map(toDto), total };
}

async function findById(id) {
  const s = await prisma.horseService.findUnique({ where: { id } });
  if (!s) throw Object.assign(new Error('Horse service not found'), { status: 404 });
  return toDto(s);
}

async function getByRoad(roadId) {
  const services = await prisma.horseService.findMany({ where: { roadInfoId: parseInt(roadId) } });
  return services.map(toDto);
}

async function update(id, data) {
  const existing = await prisma.horseService.findUnique({ where: { id } });
  if (!existing) throw Object.assign(new Error('Horse service not found'), { status: 404 });
  const s = await prisma.horseService.update({ where: { id }, data: toDb(data, existing) });
  return toDto(s);
}

async function remove(id) {
  const existing = await prisma.horseService.findUnique({ where: { id } });
  if (!existing) throw Object.assign(new Error('Horse service not found'), { status: 404 });
  await prisma.horseService.delete({ where: { id } });
}

module.exports = { create, findAll, findById, getByRoad, update, remove };
