import { prisma } from './prisma';

export async function recomputeUserUsedBytes(userId: string) {
  const sum = await prisma.driveFile.aggregate({
    _sum: { sizeBytes: true },
    where: { userId, deletedAt: null }
  });

  const used = sum._sum.sizeBytes ?? BigInt(0);
  await prisma.user.update({ where: { id: userId }, data: { usedBytes: used } });
  return used;
}
