import { Router } from 'express';
import { publicShareDownload, publicShareMeta } from '../controllers/public-controller.js';

export const publicRouter = Router();

publicRouter.get('/share/:token', publicShareMeta);
publicRouter.get('/share/:token/download', publicShareDownload);
