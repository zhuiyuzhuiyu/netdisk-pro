import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { ensureDir } from '../utils/filesystem.js';
import {
  createFolderHandler,
  createShareHandler,
  deleteItemHandler,
  downloadHandler,
  folderTree,
  listItems,
  listShareHandler,
  moveItemHandler,
  purgeItemHandler,
  quotaHandler,
  renameItemHandler,
  restoreItemHandler,
  revokeShareHandler,
  uploadHandler
} from '../controllers/drive-controller.js';

const tempDir = `${config.uploadRoot}/.tmp`;
await ensureDir(tempDir);

const uploader = multer({
  dest: tempDir,
  limits: { fileSize: 200 * 1024 * 1024 }
});

export const driveRouter = Router();

driveRouter.get('/tree', folderTree);
driveRouter.get('/items', listItems);
driveRouter.post('/folders', createFolderHandler);
driveRouter.patch('/items/:itemId/rename', renameItemHandler);
driveRouter.patch('/items/:itemId/move', moveItemHandler);
driveRouter.delete('/items/:itemId', deleteItemHandler);
driveRouter.post('/items/:itemId/restore', restoreItemHandler);
driveRouter.delete('/items/:itemId/purge', purgeItemHandler);
driveRouter.post('/upload', uploader.single('file'), uploadHandler);
driveRouter.get('/items/:itemId/download', downloadHandler);
driveRouter.post('/items/:itemId/shares', createShareHandler);
driveRouter.get('/items/:itemId/shares', listShareHandler);
driveRouter.delete('/shares/:linkId', revokeShareHandler);
driveRouter.get('/quota', quotaHandler);
