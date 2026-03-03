import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password || String(password).length < 6) {
      return NextResponse.json({ message: 'email/password invalid' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: 'email already exists' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash: hash },
      select: { id: true, email: true, createdAt: true }
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'bad request' }, { status: 400 });
  }
}
