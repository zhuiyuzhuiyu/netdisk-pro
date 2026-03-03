import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { toJsonValue } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);

    const [files, folders] = await Promise.all([
      prisma.driveFile.findMany({ where: { userId, deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' } }),
      prisma.folder.findMany({ where: { userId, deletedAt: { not: null } }, orderBy: { deletedAt: 'desc' } })
    ]);

    return NextResponse.json({ files: toJsonValue(files), folders: toJsonValue(folders) });
  } catch {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  }
}
