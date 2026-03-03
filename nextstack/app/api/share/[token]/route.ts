import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { toJsonValue } from '@/lib/json';
import { prisma } from '@/lib/prisma';

function isExpired(expiresAt: Date | null) {
  return !!(expiresAt && expiresAt.getTime() < Date.now());
}

async function loadShare(token: string) {
  return prisma.shareLink.findUnique({
    where: { token },
    include: {
      file: true,
      folder: true
    }
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const share = await loadShare(token);

  if (!share) {
    return NextResponse.json({ message: 'share not found' }, { status: 404 });
  }

  if (isExpired(share.expiresAt)) {
    return NextResponse.json({ message: 'share expired' }, { status: 410 });
  }

  return NextResponse.json({
    token,
    requiresPassword: !!share.passwordHash,
    hasFile: !!share.fileId,
    hasFolder: !!share.folderId,
    expiresAt: share.expiresAt
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { password } = await req.json().catch(() => ({ password: '' }));

  const share = await loadShare(token);
  if (!share) {
    return NextResponse.json({ message: 'share not found' }, { status: 404 });
  }

  if (isExpired(share.expiresAt)) {
    return NextResponse.json({ message: 'share expired' }, { status: 410 });
  }

  if (share.passwordHash) {
    const ok = await bcrypt.compare(String(password || ''), share.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: 'invalid share password' }, { status: 401 });
    }
  }

  if (share.file) {
    if (share.file.deletedAt) {
      return NextResponse.json({ message: 'file no longer available' }, { status: 410 });
    }

    return NextResponse.json(
      toJsonValue({
        type: 'file',
        file: {
          id: share.file.id,
          name: share.file.name,
          sizeBytes: share.file.sizeBytes,
          mimeType: share.file.mimeType,
          downloadUrl: `/api/share/${token}/download`
        }
      })
    );
  }

  if (share.folder) {
    if (share.folder.deletedAt) {
      return NextResponse.json({ message: 'folder no longer available' }, { status: 410 });
    }

    const files = await prisma.driveFile.findMany({
      where: { folderId: share.folder.id, deletedAt: null },
      select: { id: true, name: true, sizeBytes: true, mimeType: true, createdAt: true }
    });

    return NextResponse.json(
      toJsonValue({
        type: 'folder',
        folder: { id: share.folder.id, name: share.folder.name },
        files,
        downloadUrlTemplate: `/api/share/${token}/download?fileId=`
      })
    );
  }

  return NextResponse.json({ message: 'empty share target' }, { status: 410 });
}
