import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { toJsonValue } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { recomputeUserUsedBytes } from '@/lib/quota';

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const { type, id } = await req.json();

    if (!type || !id) {
      return NextResponse.json({ message: 'type/id required' }, { status: 400 });
    }

    if (type === 'file') {
      const file = await prisma.driveFile.findFirst({ where: { id, userId, deletedAt: { not: null } } });
      if (!file) return NextResponse.json({ message: 'file not found in trash' }, { status: 404 });
      const restored = await prisma.driveFile.update({ where: { id }, data: { deletedAt: null } });
      await recomputeUserUsedBytes(userId);
      return NextResponse.json(toJsonValue(restored));
    }

    if (type === 'folder') {
      const folder = await prisma.folder.findFirst({ where: { id, userId, deletedAt: { not: null } } });
      if (!folder) return NextResponse.json({ message: 'folder not found in trash' }, { status: 404 });
      const restored = await prisma.folder.update({ where: { id }, data: { deletedAt: null } });
      return NextResponse.json(toJsonValue(restored));
    }

    return NextResponse.json({ message: 'type must be file or folder' }, { status: 400 });
  } catch {
    return NextResponse.json({ message: 'unauthorized or bad request' }, { status: 400 });
  }
}
