const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ── Roles ──────────────────────────────────────────────────────────────────
  await prisma.role.upsert({ where: { name: 'ADMIN' },       update: {}, create: { name: 'ADMIN' } });
  await prisma.role.upsert({ where: { name: 'CLIENT' },      update: {}, create: { name: 'CLIENT' } });
  await prisma.role.upsert({ where: { name: 'HOTEL_OWNER' }, update: {}, create: { name: 'HOTEL_OWNER' } });
  await prisma.role.upsert({ where: { name: 'USER' },        update: {}, create: { name: 'USER' } });
  console.log('✓ Roles created');

  // ── Booking statuses ───────────────────────────────────────────────────────
  for (const name of ['REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED', 'PAID', 'APPROVED', 'REJECTED']) {
    await prisma.bookingStatusEntity.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log('✓ Booking statuses created');

  // ── Admin user ─────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@tourism.local',
      fullName: 'Admin User',
      passwordHash: hash,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      active: true,
      roles: { connect: { name: 'ADMIN' } },
    },
  });
  console.log('✓ Admin user created (username: admin, password: admin123)');

  console.log('✅ Seed complete');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
