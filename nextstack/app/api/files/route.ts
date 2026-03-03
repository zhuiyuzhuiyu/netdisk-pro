import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { toJsonValue } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { recomputeUserUsedBytes } from '@/lib/quota';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const includeDeleted = req.nextUrl.searchParams.get('includeDeleted') === '1';
    const folderIdParam = req.nextUrl.searchParams.get('folderId');

    const where: {
      userId: string;
      deletedAt: Date | null | undefined;
      folderId?: string | null;
    } = {
      userId,
      deletedAt: includeDeleted ? undefined : null
    };

    if (folderIdParam !== null) {
      where.folderId = folderIdParam || null;
    }

    const files = await prisma.driveFile.findMany({ where, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ items: toJsonValue(files) });
  } catch {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const { id, name, folderId } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'id required' }, { status: 400 });
    }

    const found = await prisma.driveFile.findFirst({ where: { id, userId } });
    if (!found) {
      return NextResponse.json({ message: 'file not found' }, { status: 404 });
    }

    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId, deletedAt: null } });
      if (!folder) {
        return NextResponse.json({ message: 'target folder not found' }, { status: 404 });
      }
    }

    const updated = await prisma.driveFile.update({
      where: { id },
      data: {
        name: name ?? undefined,
        folderId: folderId === undefined ? undefined : folderId || null
      }
    });

    return NextResponse.json(toJsonValue(updated));
  } catch {
    return NextResponse.json({ message: 'unauthorized or bad request' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'id required' }, { status: 400 });
    }

    const found = await prisma.driveFile.findFirst({ where: { id, userId, deletedAt: null } });
    if (!found) {
      return NextResponse.json({ message: 'file not found' }, { status: 404 });
    }

    const updated = await prisma.driveFile.update({ where: { id }, data: { deletedAt: new Date() } });
    await recomputeUserUsedBytes(userId);
    return NextResponse.json(toJsonValue(updated));
  } catch {
    return NextResponse.json({ message: 'unauthorized or bad request' }, { status: 400 });
  }
}
