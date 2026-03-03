import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
export async function POST(req: Request){
  const {email,password} = await req.json();
  const user = await prisma.user.findUnique({where:{email}});
  if(!user) return NextResponse.json({message:'invalid'}, {status:401});
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return NextResponse.json({message:'invalid'}, {status:401});
  return NextResponse.json({token: signToken({sub:user.id,email:user.email})});
}
