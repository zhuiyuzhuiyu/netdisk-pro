import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readLocalFile } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = requireAuth(req);
    const { id } = await params;

    const file = await prisma.driveFile.findFirst({ where: { id, userId, deletedAt: null } });
    if (!file) {
      return NextResponse.json({ message: 'file not found' }, { status: 404 });
    }

    const content = await readLocalFile(file.storageKey);
    return new NextResponse(content, {
      headers: {
        'content-type': file.mimeType || 'application/octet-stream',
        'content-disposition': `attachment; filename="${encodeURIComponent(file.name)}"`
      }
    });
  } catch {
    return NextResponse.json({ message: 'unauthorized or download failed' }, { status: 400 });
  }
}
