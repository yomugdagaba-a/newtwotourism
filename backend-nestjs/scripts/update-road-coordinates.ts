import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRoadCoordinates() {
  try {
    console.log('Starting road coordinates update...');

    // Update road 2: desse -> Addis Ababa to Desse
    // Addis Ababa coordinates: 9.0320, 38.7469
    const road2 = await prisma.roadInfo.update({
      where: { id: 2 },
      data: {
        startLatitude: 9.0320,
        startLongitude: 38.7469,
      },
    });
    console.log('✅ Updated Road 2 (desse):', road2);

    // Update road 3: addis ababa -> Addis Ababa to Lalibela
    // Addis Ababa coordinates: 9.0320, 38.7469
    const road3 = await prisma.roadInfo.update({
      where: { id: 3 },
      data: {
        startLatitude: 9.0320,
        startLongitude: 38.7469,
      },
    });
    console.log('✅ Updated Road 3 (addis ababa):', road3);

    console.log('\n✅ All roads updated successfully!');
    console.log('\nUpdated roads:');
    console.log('- Road 2: desse (560 km) - Starting from Addis Ababa (9.0320, 38.7469)');
    console.log('- Road 3: addis ababa (650 km) - Starting from Addis Ababa (9.0320, 38.7469)');

  } catch (error) {
    console.error('❌ Error updating roads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRoadCoordinates();
