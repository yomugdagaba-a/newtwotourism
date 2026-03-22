const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.hotelImage.findMany({ take: 5 })
  .then(r => console.log('Hotel images:', JSON.stringify(r, null, 2)))
  .catch(e => console.log('Error:', e.message))
  .finally(() => p.$disconnect());
