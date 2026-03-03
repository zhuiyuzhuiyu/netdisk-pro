import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readLocalFile } from '@/lib/storage';

function isExpired(expiresAt: Date | null) {
  return !!(expiresAt && expiresAt.getTime() < Date.now());
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const share = await prisma.shareLink.findUnique({
    where: { token },
    include: { file: true, folder: true }
  });

  if (!share) {
    return NextResponse.json({ message: 'share not found' }, { status: 404 });
  }

  if (isExpired(share.expiresAt)) {
    return NextResponse.json({ message: 'share expired' }, { status: 410 });
  }

  let file = share.file;

  if (!file && share.folder) {
    const fileId = req.nextUrl.searchParams.get('fileId');
    if (!fileId) {
      return NextResponse.json({ message: 'fileId required for folder share download' }, { status: 400 });
    }
    file = await prisma.driveFile.findFirst({
      where: { id: fileId, folderId: share.folder.id, deletedAt: null }
    });
  }

  if (!file || file.deletedAt) {
    return NextResponse.json({ message: 'file not found' }, { status: 404 });
  }

  const content = await readLocalFile(file.storageKey);
  return new NextResponse(content, {
    headers: {
      'content-type': file.mimeType || 'application/octet-stream',
      'content-disposition': `attachment; filename="${encodeURIComponent(file.name)}"`
    }
  });
}
