import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recomputeUserUsedBytes } from '@/lib/quota';

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireAuth(req);
    const used = await recomputeUserUsedBytes(userId);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { usedBytes: true } });

    return NextResponse.json({ usedBytes: Number(used), userUsedBytes: Number(user?.usedBytes || 0n) });
  } catch {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  }
}
