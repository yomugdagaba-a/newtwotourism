import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER' },
  });

  const hotelOwnerRole = await prisma.role.upsert({
    where: { name: 'HOTEL_OWNER' },
    update: {},
    create: { name: 'HOTEL_OWNER' },
  });

  const clientRole = await prisma.role.upsert({
    where: { name: 'CLIENT' },
    update: {},
    create: { name: 'CLIENT' },
  });

  console.log('✓ Roles created');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@tourism.local',
      fullName: 'Admin User',
      passwordHash: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      active: true,
      roles: {
        connect: [{ id: adminRole.id }],
      },
    },
  });

  // Create hotel owner user
  const hotelOwnerUser = await prisma.user.upsert({
    where: { username: 'hotelowner' },
    update: {},
    create: {
      username: 'hotelowner',
      email: 'owner@tourism.local',
      fullName: 'Hotel Owner User',
      passwordHash: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      active: true,
      roles: {
        connect: [{ id: hotelOwnerRole.id }],
      },
    },
  });

  // Create client user
  const clientUser = await prisma.user.upsert({
    where: { username: 'client' },
    update: {},
    create: {
      username: 'client',
      email: 'client@tourism.local',
      fullName: 'Client User',
      passwordHash: hashedPassword,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      active: true,
      roles: {
        connect: [{ id: clientRole.id }],
      },
    },
  });

  console.log('✓ Admin, hotel owner, and client users created');

  // Create booking statuses
  const statuses = ['REQUESTED', 'COST_PROPOSED', 'PAID', 'APPROVED', 'REJECTED'];
  for (const status of statuses) {
    await prisma.bookingStatusEntity.upsert({
      where: { name: status as any },
      update: {},
      create: { name: status as any },
    });
  }

  console.log('✓ Booking statuses created');

  // Create tourism places
  const lalibela = await prisma.tourismPlace.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Lalibela Rock Churches',
      categories: ['HERITAGE'],
      description: 'UNESCO World Heritage site featuring 11 medieval monolithic rock-hewn churches. A masterpiece of human creative genius.',
      wereda: 'Lalibela',
      kebele: 'Lalibela Town',
      bestTime: 'October to March',
      peaceInfo: 'Very safe and welcoming destination',
      visitTime: 120,
      languages: ['Amharic', 'English'],
      status: 'ACTIVE',
      viewersCount: 1250,
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    },
  });
  console.log(`✓ Tourism place created: ${lalibela.name}`);

  const simien = await prisma.tourismPlace.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Simien Mountains',
      categories: ['HIGHLAND'],
      description: 'Stunning highland scenery with endemic wildlife including Gelada baboons and Walia ibex. Perfect for trekking.',
      wereda: 'Debark',
      kebele: 'Simien',
      bestTime: 'September to November',
      peaceInfo: 'Safe with local guides recommended',
      visitTime: 480,
      languages: ['Amharic', 'English'],
      status: 'ACTIVE',
      viewersCount: 980,
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    },
  });
  console.log(`✓ Tourism place created: ${simien.name}`);

  const lakeHayk = await prisma.tourismPlace.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Lake Hayk',
      categories: ['AQUATICS'],
      description: 'Beautiful highland lake surrounded by monasteries. Great for bird watching and peaceful retreats.',
      wereda: 'Hayk',
      kebele: 'Hayk Town',
      bestTime: 'October to February',
      peaceInfo: 'Safe and serene environment',
      visitTime: 180,
      languages: ['Amharic', 'English'],
      status: 'ACTIVE',
      viewersCount: 543,
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    },
  });
  console.log(`✓ Tourism place created: ${lakeHayk.name}`);

  // Create hotels with images
  const honeyLand = await prisma.hotel.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Honey Land Hotel',
      description: 'Amazing room with beautiful view and great value. Restaurant with delicious food at fair prices.',
      contactInfo: '0965432345',
      starRating: 4,
      active: true,
      tourismPlaceId: lalibela.id,
      ownerId: hotelOwnerUser.id,
    },
  });
  console.log(`✓ Hotel created: ${honeyLand.name}`);

  // Add images to Honey Land Hotel
  await prisma.hotelImage.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      hotelId: honeyLand.id,
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      displayOrder: 0,
    },
  });

  await prisma.hotelImage.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      hotelId: honeyLand.id,
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=800&q=80',
      displayOrder: 1,
    },
  });
  console.log(`✓ Hotel images added for: ${honeyLand.name}`);

  const blueNile = await prisma.hotel.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Blue Nile Inn',
      description: 'Cozy hotel near the Blue Nile with excellent service and comfortable rooms.',
      contactInfo: '0912345678',
      starRating: 3,
      active: true,
      tourismPlaceId: lalibela.id,
      ownerId: hotelOwnerUser.id,
    },
  });
  console.log(`✓ Hotel created: ${blueNile.name}`);

  // Add images to Blue Nile Inn
  await prisma.hotelImage.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      hotelId: blueNile.id,
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      displayOrder: 0,
    },
  });

  await prisma.hotelImage.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      hotelId: blueNile.id,
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=800&q=80',
      displayOrder: 1,
    },
  });
  console.log(`✓ Hotel images added for: ${blueNile.name}`);

  // Add images to tourism places
  await prisma.tourismImage.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      tourismPlaceId: lalibela.id,
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      displayOrder: 0,
    },
  });

  await prisma.tourismImage.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      tourismPlaceId: lalibela.id,
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
      displayOrder: 1,
    },
  });

  await prisma.tourismImage.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      tourismPlaceId: simien.id,
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
      displayOrder: 0,
    },
  });

  await prisma.tourismImage.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      tourismPlaceId: simien.id,
      imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      displayOrder: 1,
    },
  });

  await prisma.tourismImage.upsert({
    where: { id: 5 },
    update: {},
    create: {
      id: 5,
      tourismPlaceId: lakeHayk.id,
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
      displayOrder: 0,
    },
  });

  await prisma.tourismImage.upsert({
    where: { id: 6 },
    update: {},
    create: {
      id: 6,
      tourismPlaceId: lakeHayk.id,
      imageUrl: 'https://images.unsplash.com/photo-1564507592333-cdd18562ea6f?w=800&q=80',
      displayOrder: 1,
    },
  });
  console.log('✓ Tourism images added');

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
