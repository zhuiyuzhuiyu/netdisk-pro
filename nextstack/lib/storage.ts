import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { env } from './env';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function ensureStorageDir() {
  await fs.mkdir(env.STORAGE_DIR, { recursive: true });
}

export async function saveLocalFile(params: { userId: string; file: File }) {
  const { userId, file } = params;
  await ensureStorageDir();
  const safeName = sanitizeFileName(file.name || 'upload.bin');
  const key = `${userId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const abs = path.join(env.STORAGE_DIR, key);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(abs, buf);
  return { key, size: buf.byteLength, mimeType: file.type || 'application/octet-stream' };
}

export async function readLocalFile(key: string) {
  const abs = path.join(env.STORAGE_DIR, key);
  return fs.readFile(abs);
}

export async function deleteLocalFile(key: string) {
  const abs = path.join(env.STORAGE_DIR, key);
  try {
    await fs.unlink(abs);
  } catch {
    // Keep API idempotent for deletion.
  }
}
