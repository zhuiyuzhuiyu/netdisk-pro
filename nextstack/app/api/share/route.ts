import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { toJsonValue } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const shares = await prisma.shareLink.findMany({
      where: { userId },
      include: {
        file: { select: { id: true, name: true, deletedAt: true } },
        folder: { select: { id: true, name: true, deletedAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ items: toJsonValue(shares) });
  } catch {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const { fileId, folderId, password, expiresAt } = await req.json();

    if ((fileId && folderId) || (!fileId && !folderId)) {
      return NextResponse.json({ message: 'exactly one of fileId/folderId required' }, { status: 400 });
    }

    if (fileId) {
      const file = await prisma.driveFile.findFirst({ where: { id: fileId, userId, deletedAt: null } });
      if (!file) {
        return NextResponse.json({ message: 'file not found' }, { status: 404 });
      }
    }

    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId, deletedAt: null } });
      if (!folder) {
        return NextResponse.json({ message: 'folder not found' }, { status: 404 });
      }
    }

    const row = await prisma.shareLink.create({
      data: {
        userId,
        fileId: fileId || null,
        folderId: folderId || null,
        token: crypto.randomBytes(24).toString('base64url'),
        passwordHash: password ? await bcrypt.hash(password, 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });

    return NextResponse.json(toJsonValue(row), { status: 201 });
  } catch {
    return NextResponse.json({ message: 'unauthorized or bad request' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await req.json();

    const found = await prisma.shareLink.findFirst({ where: { id, userId } });
    if (!found) {
      return NextResponse.json({ message: 'share not found' }, { status: 404 });
    }

    await prisma.shareLink.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'unauthorized or bad request' }, { status: 400 });
  }
}
