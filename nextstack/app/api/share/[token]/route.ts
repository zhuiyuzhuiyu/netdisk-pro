import { NextResponse } from 'next/server';
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }){
  const p = await params;
  return NextResponse.json({token:p.token,status:'pending-M2'});
}
