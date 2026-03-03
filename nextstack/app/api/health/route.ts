import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { env } from '@/lib/env';

export async function GET() {
  const now = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    return NextResponse.json(
      { status: 'degraded', db: 'down', storage: 'unknown', ts: now, error: String(error) },
      { status: 503 }
    );
  }

  try {
    await fs.mkdir(env.STORAGE_DIR, { recursive: true });
  } catch (error) {
    return NextResponse.json(
      { status: 'degraded', db: 'up', storage: 'down', ts: now, error: String(error) },
      { status: 503 }
    );
  }

  return NextResponse.json({ status: 'ok', db: 'up', storage: 'up', ts: now });
}
