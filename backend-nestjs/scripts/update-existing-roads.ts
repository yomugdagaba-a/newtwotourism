import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateExistingRoads() {
  try {
    console.log('Updating existing roads with all distance types...\n');

    // Update Road 2: Desse
    const road2Data = {
      distanceByCar: 560,
      distanceByFoot: 750,
      distanceByHorse: 600,
      distanceByPlane: 1.2,
      totalDistance: 560,
    };

    const road2 = await prisma.roadInfo.update({
      where: { id: 2 },
      data: {
        condition: JSON.stringify(road2Data),
      },
    });

    console.log('✅ Updated Road 2 (Desse):');
    console.log(`   - Distance by Car: ${road2Data.distanceByCar} km`);
    console.log(`   - Distance by Foot: ${road2Data.distanceByFoot} km`);
    console.log(`   - Distance by Horse: ${road2Data.distanceByHorse} km`);
    console.log(`   - Distance by Plane: ${road2Data.distanceByPlane} km`);
    console.log(`   - Total Distance: ${road2Data.totalDistance} km\n`);

    // Update Road 3: Addis Ababa
    const road3Data = {
      distanceByCar: 650,
      distanceByFoot: 850,
      distanceByHorse: 700,
      distanceByPlane: 1.5,
      totalDistance: 650,
    };

    const road3 = await prisma.roadInfo.update({
      where: { id: 3 },
      data: {
        condition: JSON.stringify(road3Data),
      },
    });

    console.log('✅ Updated Road 3 (Addis Ababa):');
    console.log(`   - Distance by Car: ${road3Data.distanceByCar} km`);
    console.log(`   - Distance by Foot: ${road3Data.distanceByFoot} km`);
    console.log(`   - Distance by Horse: ${road3Data.distanceByHorse} km`);
    console.log(`   - Distance by Plane: ${road3Data.distanceByPlane} km`);
    console.log(`   - Total Distance: ${road3Data.totalDistance} km\n`);

    console.log('✅ All roads updated successfully!');
    console.log('\nNow refresh the page to see the changes.');

  } catch (error) {
    console.error('❌ Error updating roads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateExistingRoads();
