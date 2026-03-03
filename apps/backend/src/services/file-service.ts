import fs from 'node:fs/promises';
import path from 'node:path';
import { ItemType, type FileItem } from '@prisma/client';
import { prisma } from '../prisma.js';
import { config } from '../config.js';
import { ensureDir, safeJoin } from '../utils/filesystem.js';

const assertFolderOwnership = async (userId: string, folderId: string | null) => {
  if (!folderId) return;

  const folder = await prisma.fileItem.findFirst({
    where: {
      id: folderId,
      userId,
      type: ItemType.FOLDER,
      deletedAt: null
    }
  });

  if (!folder) {
    throw new Error('Folder not found');
  }
};

export const listFolder = async (userId: string, folderId: string | null, includeDeleted = false) => {
  await assertFolderOwnership(userId, folderId);

  const items = await prisma.fileItem.findMany({
    where: {
      userId,
      parentId: folderId,
      ...(includeDeleted ? {} : { deletedAt: null })
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }]
  });

  return items;
};

export const getFolderTree = async (userId: string) => {
  const folders = await prisma.fileItem.findMany({
    where: { userId, type: ItemType.FOLDER, deletedAt: null },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }]
  });

  return folders;
};

export const createFolder = async (userId: string, name: string, parentId: string | null) => {
  await assertFolderOwnership(userId, parentId);

  return prisma.fileItem.create({
    data: {
      userId,
      name,
      type: ItemType.FOLDER,
      parentId
    }
  });
};

export const renameItem = async (userId: string, itemId: string, name: string) => {
  const item = await prisma.fileItem.findFirst({ where: { id: itemId, userId, deletedAt: null } });
  if (!item) throw new Error('Item not found');

  return prisma.fileItem.update({
    where: { id: itemId },
    data: { name }
  });
};

const isDescendant = async (itemId: string, potentialParentId: string) => {
  let cursor: string | null = potentialParentId;
  while (cursor) {
    if (cursor === itemId) return true;
    const parent: Pick<FileItem, 'parentId'> | null = await prisma.fileItem.findUnique({
      where: { id: cursor },
      select: { parentId: true }
    });
    cursor = parent?.parentId ?? null;
  }
  return false;
};

export const moveItem = async (userId: string, itemId: string, targetParentId: string | null) => {
  const item = await prisma.fileItem.findFirst({ where: { id: itemId, userId, deletedAt: null } });
  if (!item) throw new Error('Item not found');

  await assertFolderOwnership(userId, targetParentId);

  if (targetParentId && item.type === ItemType.FOLDER) {
    const circular = await isDescendant(itemId, targetParentId);
    if (circular) throw new Error('Cannot move folder into itself');
  }

  return prisma.fileItem.update({
    where: { id: itemId },
    data: { parentId: targetParentId }
  });
};

const markDeletedRecursively = async (userId: string, itemId: string, deletedAt: Date) => {
  const children = await prisma.fileItem.findMany({
    where: { userId, parentId: itemId, deletedAt: null }
  });

  for (const child of children) {
    await markDeletedRecursively(userId, child.id, deletedAt);
  }

  await prisma.fileItem.update({ where: { id: itemId }, data: { deletedAt } });
};

export const softDeleteItem = async (userId: string, itemId: string) => {
  const item = await prisma.fileItem.findFirst({ where: { id: itemId, userId, deletedAt: null } });
  if (!item) throw new Error('Item not found');

  const deletedAt = new Date();
  await markDeletedRecursively(userId, itemId, deletedAt);
};

const restoreRecursively = async (userId: string, itemId: string) => {
  const children = await prisma.fileItem.findMany({ where: { userId, parentId: itemId } });

  for (const child of children) {
    await restoreRecursively(userId, child.id);
  }

  await prisma.fileItem.update({ where: { id: itemId }, data: { deletedAt: null } });
};

export const restoreItem = async (userId: string, itemId: string) => {
  const item = await prisma.fileItem.findFirst({ where: { id: itemId, userId } });
  if (!item) throw new Error('Item not found');

  await restoreRecursively(userId, itemId);
};

export const removePermanently = async (userId: string, itemId: string) => {
  const item = await prisma.fileItem.findFirst({ where: { id: itemId, userId } });
  if (!item) throw new Error('Item not found');

  if (item.diskPath) {
    const full = safeJoin(config.uploadRoot, item.diskPath);
    await fs.rm(full, { force: true });
  }

  await prisma.fileItem.delete({ where: { id: itemId } });
};

export const registerUploadedFile = async (params: {
  userId: string;
  parentId: string | null;
  name: string;
  mimeType?: string;
  size: number;
  tempPath: string;
}) => {
  const { userId, parentId, name, mimeType, size, tempPath } = params;

  await assertFolderOwnership(userId, parentId);

  const userRoot = path.join(config.uploadRoot, userId);
  await ensureDir(userRoot);

  const ext = path.extname(name);
  const base = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const diskName = `${base}${ext}`;
  const finalPath = path.join(userRoot, diskName);

  await fs.rename(tempPath, finalPath);

  const diskPath = path.relative(config.uploadRoot, finalPath);

  return prisma.fileItem.create({
    data: {
      userId,
      parentId,
      name,
      type: ItemType.FILE,
      mimeType,
      size,
      diskPath
    }
  });
};

export const resolveOwnedFile = async (userId: string, itemId: string) => {
  const file = await prisma.fileItem.findFirst({
    where: { id: itemId, userId, type: ItemType.FILE, deletedAt: null }
  });

  if (!file || !file.diskPath) {
    throw new Error('File not found');
  }

  return file;
};

export const getQuotaStats = async (userId: string) => {
  const files = await prisma.fileItem.aggregate({
    where: { userId, type: ItemType.FILE, deletedAt: null },
    _sum: { size: true },
    _count: true
  });

  const usedBytes = files._sum.size ?? 0;
  return {
    usedBytes,
    maxBytes: config.maxQuotaBytes,
    usagePercent: Number(((usedBytes / config.maxQuotaBytes) * 100).toFixed(2)),
    fileCount: files._count
  };
};
