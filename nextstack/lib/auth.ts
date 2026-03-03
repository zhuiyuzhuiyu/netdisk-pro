import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { env } from './env';

export type AuthUser = {
  userId: string;
  email: string;
};

export function signToken(payload: { sub: string; email: string }) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload & { sub: string; email: string } {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload & { sub: string; email: string };
}

export function getBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

export function requireAuth(req: NextRequest): AuthUser {
  const token = getBearerToken(req);
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }
  const payload = verifyToken(token);
  return { userId: payload.sub, email: payload.email };
}
