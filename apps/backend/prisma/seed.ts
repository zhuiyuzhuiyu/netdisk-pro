import bcrypt from 'bcryptjs';
import { PrismaClient, ItemType } from '@prisma/client';

const prisma = new PrismaClient();

const seed = async () => {
  const email = 'demo@clouddrive.pro';
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash }
  });

  const rootFolder = await prisma.fileItem.create({
    data: {
      userId: user.id,
      name: 'Projects',
      type: ItemType.FOLDER
    }
  });

  await prisma.fileItem.createMany({
    data: [
      {
        userId: user.id,
        name: 'Roadmap.txt',
        type: ItemType.FILE,
        parentId: rootFolder.id,
        size: 1280,
        mimeType: 'text/plain',
        diskPath: null
      },
      {
        userId: user.id,
        name: 'Archive',
        type: ItemType.FOLDER,
        parentId: rootFolder.id
      }
    ],
    skipDuplicates: true
  });

  console.log('Seeded demo user: demo@clouddrive.pro / Password123!');
};

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
