const prisma = require('../lib/prisma');

async function create(data) {
  return prisma.languageGuider.create({ data });
}

async function findAll(skip = 0, take = 10) {
  const [guiders, total] = await Promise.all([
    prisma.languageGuider.findMany({ skip: parseInt(skip), take: parseInt(take) }),
    prisma.languageGuider.count(),
  ]);
  return { guiders, total };
}

async function findById(id) {
  const g = await prisma.languageGuider.findUnique({ where: { id } });
  if (!g) throw Object.assign(new Error('Language guider not found'), { status: 404 });
  return g;
}

async function update(id, data) {
  const g = await prisma.languageGuider.findUnique({ where: { id } });
  if (!g) throw Object.assign(new Error('Language guider not found'), { status: 404 });
  return prisma.languageGuider.update({ where: { id }, data });
}

async function remove(id) {
  const g = await prisma.languageGuider.findUnique({ where: { id } });
  if (!g) throw Object.assign(new Error('Language guider not found'), { status: 404 });
  return prisma.languageGuider.delete({ where: { id } });
}

async function findByLanguage(language) {
  return prisma.languageGuider.findMany({ where: { languages: { has: language } } });
}

module.exports = { create, findAll, findById, update, remove, findByLanguage };
