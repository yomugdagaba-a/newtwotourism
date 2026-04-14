/**
 * Jest globalSetup — runs once before all test suites in a separate process.
 * Loads .env.test so DATABASE_URL points to tourism_test for all tests.
 */

const path = require('path');

module.exports = async function globalSetup() {
  // Load test environment variables FIRST — before any Prisma client is created
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env.test'), override: true });

  // Now safe to require Prisma (it will use the test DATABASE_URL)
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Seed required booking statuses
    const statuses = ['REQUESTED', 'OWNER_ACCEPTED', 'COST_PROPOSED', 'PAID', 'APPROVED', 'REJECTED'];
    for (const name of statuses) {
      await prisma.bookingStatusEntity.upsert({ where: { name }, update: {}, create: { name } });
    }

    // Seed roles
    for (const name of ['ADMIN', 'CLIENT', 'HOTEL_OWNER']) {
      await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    }

    // Seed admin user
    const bcrypt = require('bcryptjs');
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

    // Clean up stale login attempts and lockouts from previous runs
    await prisma.loginAttempt.deleteMany({});
    await prisma.accountLockout.deleteMany({});

    console.log('✓ Test DB setup complete (tourism_test)');
  } catch (e) {
    console.error('Setup error:', e.message);
    throw e;
  } finally {
    await prisma.$disconnect();
  }
};
