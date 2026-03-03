import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response } from 'express';
import { config } from '../config.js';
import { getPublicShareFile } from '../services/share-service.js';
import { safeJoin } from '../utils/filesystem.js';

export const publicShareMeta = async (req: Request, res: Response) => {
  const password = typeof req.query.password === 'string' ? req.query.password : undefined;
  try {
    const file = await getPublicShareFile(req.params.token, password);
    return res.json({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size
    });
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const publicShareDownload = async (req: Request, res: Response) => {
  const password = typeof req.query.password === 'string' ? req.query.password : undefined;

  try {
    const file = await getPublicShareFile(req.params.token, password);
    const fullPath = safeJoin(config.uploadRoot, file.diskPath!);

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Type', file.mimeType ?? 'application/octet-stream');

    fs.createReadStream(path.resolve(fullPath)).pipe(res);
    return;
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};
