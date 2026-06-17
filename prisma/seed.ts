import { PrismaClient } from '@prisma/client';
import { MOCK_LOCATIONS } from '../src/data/mockLocations';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Supprimer les données existantes
  await prisma.routePoint.deleteMany();
  await prisma.route.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.collectionPoint.deleteMany();

  console.log('📍 Creating collection points...');

  // Créer les points de collecte à partir des données mockées
  for (const location of MOCK_LOCATIONS) {
    await prisma.collectionPoint.create({
      data: {
        id: location.id,
        name: location.name,
        lat: location.lat,
        lng: location.lng,
        status: location.status,
        estimatedVolume: location.estimatedVolume,
      },
    });
  }

  console.log(`✅ Created ${MOCK_LOCATIONS.length} collection points`);
  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
