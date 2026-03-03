import fs from 'node:fs';
import path from 'node:path';
import type { Response } from 'express';
import { z } from 'zod';
import type { AuthedRequest } from '../types.js';
import {
  createFolder,
  getFolderTree,
  getQuotaStats,
  listFolder,
  moveItem,
  registerUploadedFile,
  removePermanently,
  renameItem,
  resolveOwnedFile,
  restoreItem,
  softDeleteItem
} from '../services/file-service.js';
import { config } from '../config.js';
import { safeJoin } from '../utils/filesystem.js';
import { createShareLink, listShareLinks, revokeShareLink } from '../services/share-service.js';

const folderSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().nullable().optional()
});

const renameSchema = z.object({
  name: z.string().min(1)
});

const moveSchema = z.object({
  targetParentId: z.string().nullable()
});

const shareSchema = z.object({
  password: z.string().min(4).optional(),
  expiresAt: z.string().datetime().optional()
});

export const listItems = async (req: AuthedRequest, res: Response) => {
  const folderId = typeof req.query.folderId === 'string' ? req.query.folderId : null;
  const includeDeleted = req.query.includeDeleted === 'true';

  try {
    const items = await listFolder(req.user!.id, folderId, includeDeleted);
    return res.json({ items });
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const folderTree = async (req: AuthedRequest, res: Response) => {
  const tree = await getFolderTree(req.user!.id);
  return res.json({ folders: tree });
};

export const createFolderHandler = async (req: AuthedRequest, res: Response) => {
  const parsed = folderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  try {
    const folder = await createFolder(req.user!.id, parsed.data.name, parsed.data.parentId ?? null);
    return res.status(201).json(folder);
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const renameItemHandler = async (req: AuthedRequest, res: Response) => {
  const parsed = renameSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

  try {
    const item = await renameItem(req.user!.id, req.params.itemId, parsed.data.name);
    return res.json(item);
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const moveItemHandler = async (req: AuthedRequest, res: Response) => {
  const parsed = moveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

  try {
    const item = await moveItem(req.user!.id, req.params.itemId, parsed.data.targetParentId ?? null);
    return res.json(item);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteItemHandler = async (req: AuthedRequest, res: Response) => {
  try {
    await softDeleteItem(req.user!.id, req.params.itemId);
    return res.status(204).send();
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const restoreItemHandler = async (req: AuthedRequest, res: Response) => {
  try {
    await restoreItem(req.user!.id, req.params.itemId);
    return res.status(204).send();
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const purgeItemHandler = async (req: AuthedRequest, res: Response) => {
  try {
    await removePermanently(req.user!.id, req.params.itemId);
    return res.status(204).send();
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const uploadHandler = async (req: AuthedRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'File required' });

  const parentId = typeof req.body.parentId === 'string' ? req.body.parentId : null;

  try {
    const item = await registerUploadedFile({
      userId: req.user!.id,
      parentId,
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      tempPath: req.file.path
    });

    return res.status(201).json(item);
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const downloadHandler = async (req: AuthedRequest, res: Response) => {
  try {
    const file = await resolveOwnedFile(req.user!.id, req.params.itemId);
    const fullPath = safeJoin(config.uploadRoot, file.diskPath!);

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.name)}"`);
    res.setHeader('Content-Type', file.mimeType ?? 'application/octet-stream');

    fs.createReadStream(path.resolve(fullPath)).pipe(res);
    return;
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const createShareHandler = async (req: AuthedRequest, res: Response) => {
  const parsed = shareSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

  try {
    const link = await createShareLink({
      userId: req.user!.id,
      fileId: req.params.itemId,
      password: parsed.data.password,
      expiresAt: parsed.data.expiresAt
    });
    return res.status(201).json(link);
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const listShareHandler = async (req: AuthedRequest, res: Response) => {
  try {
    const links = await listShareLinks(req.user!.id, req.params.itemId);
    return res.json({ links });
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const revokeShareHandler = async (req: AuthedRequest, res: Response) => {
  try {
    await revokeShareLink(req.user!.id, req.params.linkId);
    return res.status(204).send();
  } catch (error) {
    return res.status(404).json({ message: (error as Error).message });
  }
};

export const quotaHandler = async (req: AuthedRequest, res: Response) => {
  const stats = await getQuotaStats(req.user!.id);
  return res.json(stats);
};
