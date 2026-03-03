import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import path from 'node:path';
import { authRouter } from './routes/auth-routes.js';
import { driveRouter } from './routes/drive-routes.js';
import { publicRouter } from './routes/public-routes.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/error-handler.js';
import { logger } from './logger.js';

export const app = express();

app.use(
  pinoHttp({
    logger,
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    }
  })
);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/drive', requireAuth, driveRouter);
app.use('/api/public', publicRouter);

const frontendDist = process.env.FRONTEND_DIST;
if (frontendDist) {
  const distPath = path.resolve(process.cwd(), frontendDist);
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);
