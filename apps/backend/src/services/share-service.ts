import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { makeToken } from '../utils/token.js';
import type { FileItem } from '@prisma/client';

export const createShareLink = async (params: {
  userId: string;
  fileId: string;
  password?: string;
  expiresAt?: string;
}) => {
  const { userId, fileId, password, expiresAt } = params;

  const file = await prisma.fileItem.findFirst({
    where: {
      id: fileId,
      userId,
      type: 'FILE',
      deletedAt: null
    }
  });

  if (!file) throw new Error('File not found');

  const passwordHash = password ? await bcrypt.hash(password, 10) : null;

  return prisma.shareLink.create({
    data: {
      fileId,
      token: makeToken(),
      passwordHash,
      expiresAt: expiresAt ? new Date(expiresAt) : null
    }
  });
};

export const listShareLinks = async (userId: string, fileId: string) => {
  const file = await prisma.fileItem.findFirst({ where: { id: fileId, userId } });
  if (!file) throw new Error('File not found');

  return prisma.shareLink.findMany({
    where: { fileId },
    orderBy: { createdAt: 'desc' }
  });
};

export const revokeShareLink = async (userId: string, linkId: string) => {
  const link = await prisma.shareLink.findUnique({
    where: { id: linkId },
    include: { file: true }
  });

  if (!link || link.file.userId !== userId) {
    throw new Error('Link not found');
  }

  await prisma.shareLink.delete({ where: { id: linkId } });
};

export const getPublicShareFile = async (token: string, password?: string) => {
  const link = await prisma.shareLink.findUnique({ where: { token }, include: { file: true } });
  if (!link) throw new Error('Link not found');

  if (link.expiresAt && link.expiresAt < new Date()) {
    throw new Error('Link expired');
  }

  if (link.passwordHash) {
    const valid = password ? await bcrypt.compare(password, link.passwordHash) : false;
    if (!valid) throw new Error('Invalid password');
  }

  if (link.file.deletedAt || link.file.type !== 'FILE' || !link.file.diskPath) {
    throw new Error('File unavailable');
  }

  return link.file as FileItem;
};
