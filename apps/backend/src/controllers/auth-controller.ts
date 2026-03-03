import type { Request, Response } from 'express';
import { z } from 'zod';
import { loginUser, registerUser } from '../services/auth-service.js';
import type { AuthedRequest } from '../types.js';

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const register = async (req: Request, res: Response) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const user = await registerUser(parsed.data.email, parsed.data.password);
    return res.status(201).json(user);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(409).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', issues: parsed.error.flatten() });
  }

  try {
    const result = await loginUser(parsed.data.email, parsed.data.password);
    return res.json(result);
  } catch {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
};

export const me = async (req: AuthedRequest, res: Response) => {
  return res.json({ user: req.user });
};
