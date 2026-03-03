import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { toJsonValue } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { recomputeUserUsedBytes } from '@/lib/quota';
import { saveLocalFile } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const form = await req.formData();
    const file = form.get('file');
    const folderIdRaw = form.get('folderId');
    const folderId = typeof folderIdRaw === 'string' && folderIdRaw.trim() ? folderIdRaw : null;

    if (!(file instanceof File)) {
      return NextResponse.json({ message: 'file is required' }, { status: 400 });
    }

    if (folderId) {
      const folder = await prisma.folder.findFirst({ where: { id: folderId, userId, deletedAt: null } });
      if (!folder) {
        return NextResponse.json({ message: 'folder not found' }, { status: 404 });
      }
    }

    const stored = await saveLocalFile({ userId, file });
    const row = await prisma.driveFile.create({
      data: {
        userId,
        folderId,
        name: file.name,
        storageKey: stored.key,
        sizeBytes: BigInt(stored.size),
        mimeType: stored.mimeType
      }
    });

    await recomputeUserUsedBytes(userId);
    return NextResponse.json(toJsonValue(row), { status: 201 });
  } catch {
    return NextResponse.json({ message: 'unauthorized or upload failed' }, { status: 400 });
  }
}
