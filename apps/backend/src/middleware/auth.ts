import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { AuthedRequest } from '../types.js';

export const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const raw = req.headers.authorization;

  if (!raw?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing token' });
  }

  try {
    const payload = jwt.verify(raw.slice(7), config.jwtSecret) as { sub: string; email: string };
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
