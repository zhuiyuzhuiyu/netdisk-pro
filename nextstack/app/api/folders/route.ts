import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { toJsonValue } from '@/lib/json';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const includeDeleted = req.nextUrl.searchParams.get('includeDeleted') === '1';

    const folders = await prisma.folder.findMany({
      where: { userId, deletedAt: includeDeleted ? undefined : null },
      orderBy: [{ parentId: 'asc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json({ items: toJsonValue(folders) });
  } catch {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const { name, parentId } = await req.json();

    if (!name) {
      return NextResponse.json({ message: 'name required' }, { status: 400 });
    }

    if (parentId) {
      const parent = await prisma.folder.findFirst({
        where: { id: parentId, userId, deletedAt: null }
      });
      if (!parent) {
        return NextResponse.json({ message: 'parent folder not found' }, { status: 404 });
      }
    }

    const folder = await prisma.folder.create({ data: { userId, name, parentId: parentId || null } });
    return NextResponse.json(toJsonValue(folder), { status: 201 });
  } catch {
    return NextResponse.json({ message: 'unauthorized or bad request' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const { id, name, parentId } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'id required' }, { status: 400 });
    }

    const folder = await prisma.folder.findFirst({ where: { id, userId } });
    if (!folder) {
      return NextResponse.json({ message: 'folder not found' }, { status: 404 });
    }

    if (parentId && parentId !== folder.parentId) {
      const target = await prisma.folder.findFirst({ where: { id: parentId, userId, deletedAt: null } });
      if (!target) {
        return NextResponse.json({ message: 'target parent not found' }, { status: 404 });
      }
      if (target.id === folder.id) {
        return NextResponse.json({ message: 'cannot move into itself' }, { status: 400 });
      }
    }

    const updated = await prisma.folder.update({
      where: { id },
      data: {
        name: name ?? undefined,
        parentId: parentId === undefined ? undefined : parentId || null
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

    const folder = await prisma.folder.findFirst({ where: { id, userId, deletedAt: null } });
    if (!folder) {
      return NextResponse.json({ message: 'folder not found' }, { status: 404 });
    }

    const [childFolderCount, childFileCount] = await Promise.all([
      prisma.folder.count({ where: { userId, parentId: id, deletedAt: null } }),
      prisma.driveFile.count({ where: { userId, folderId: id, deletedAt: null } })
    ]);

    if (childFolderCount > 0 || childFileCount > 0) {
      return NextResponse.json(
        { message: 'folder not empty; move/delete children first' },
        { status: 409 }
      );
    }

    const updated = await prisma.folder.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json(toJsonValue(updated));
  } catch {
    return NextResponse.json({ message: 'unauthorized or bad request' }, { status: 400 });
  }
}
