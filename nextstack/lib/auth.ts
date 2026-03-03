import jwt from 'jsonwebtoken';
import { env } from './env';
export function signToken(payload: object){ return jwt.sign(payload, env.JWT_SECRET, {expiresIn:'7d'}); }
