import fs from 'node:fs/promises';
import path from 'node:path';

export const ensureDir = async (target: string) => {
  await fs.mkdir(target, { recursive: true });
};

export const safeJoin = (root: string, relativePath: string) => {
  const full = path.resolve(root, relativePath);
  const safeRoot = path.resolve(root);

  if (!full.startsWith(safeRoot)) {
    throw new Error('Invalid path');
  }

  return full;
};
