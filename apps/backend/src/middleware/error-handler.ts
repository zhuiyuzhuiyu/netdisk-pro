import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logger.js';

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'unhandled_error');
  return res.status(500).json({ message: 'Internal server error' });
};
