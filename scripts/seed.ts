import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prieelo database seeding...');

  // Create regular user
  const hashedPassword = await bcrypt.hash('johndoe123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: hashedPassword,
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      bio: 'DIY enthusiast turning trash into treasure!',
      status: 'APPROVED',
      isApproved: true,
      isAdmin: false,
    },
  });

  // Create admin user
  const adminPassword = await bcrypt.hash('witnyz-myjfi9-civnAx', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@prieelo.com' },
    update: { password: adminPassword }, // Update password if user exists
    create: {
      email: 'admin@prieelo.com',
      password: adminPassword,
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      bio: 'Platform Administrator',
      status: 'APPROVED',
      isApproved: true,
      isAdmin: true,
    },
  });

  console.log('✅ Prieelo seeding completed successfully!');
  console.log('🔑 Admin credentials: admin@prieelo.com / witnyz-myjfi9-civnAx');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
