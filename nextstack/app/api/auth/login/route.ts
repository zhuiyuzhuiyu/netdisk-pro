import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'email/password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: 'invalid credentials' }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: 'invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({
      token: signToken({ sub: user.id, email: user.email }),
      user: { id: user.id, email: user.email }
    });
  } catch {
    return NextResponse.json({ message: 'bad request' }, { status: 400 });
  }
}
