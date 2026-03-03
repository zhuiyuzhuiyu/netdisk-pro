import fs from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { prisma } from '../src/prisma.js';

let app: (typeof import('../src/app.js'))['app'];

beforeAll(async () => {
  ({ app } = await import('../src/app.js'));
});

beforeEach(async () => {
  await prisma.shareLink.deleteMany();
  await prisma.fileItem.deleteMany();
  await prisma.user.deleteMany();
  await fs.rm(path.resolve(process.cwd(), 'uploads-test'), { recursive: true, force: true });
  await fs.mkdir(path.resolve(process.cwd(), 'uploads-test/.tmp'), { recursive: true });
});

describe('health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('auth + drive', () => {
  it('supports auth, folder operations, upload and quota', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@example.com', password: 'Password123!' });

    expect(registerRes.status).toBe(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.token as string;

    const folderRes = await request(app)
      .post('/api/drive/folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Docs', parentId: null });

    expect(folderRes.status).toBe(201);

    const uploadRes = await request(app)
      .post('/api/drive/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('parentId', folderRes.body.id)
      .attach('file', Buffer.from('hello world'), { filename: 'hello.txt', contentType: 'text/plain' });

    expect(uploadRes.status).toBe(201);

    const quotaRes = await request(app)
      .get('/api/drive/quota')
      .set('Authorization', `Bearer ${token}`);

    expect(quotaRes.status).toBe(200);
    expect(quotaRes.body.usedBytes).toBeGreaterThan(0);

    const deleteRes = await request(app)
      .delete(`/api/drive/items/${uploadRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(204);

    const recycleRes = await request(app)
      .get(`/api/drive/items?includeDeleted=true&folderId=${folderRes.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(recycleRes.status).toBe(200);
    expect(recycleRes.body.items.some((i: { id: string; deletedAt: string | null }) => i.id === uploadRes.body.id && i.deletedAt)).toBe(true);

    const restoreRes = await request(app)
      .post(`/api/drive/items/${uploadRes.body.id}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(restoreRes.status).toBe(204);
  });

  it('supports share link flow with public metadata endpoint', async () => {
    await request(app).post('/api/auth/register').send({ email: 'share@example.com', password: 'Password123!' });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'share@example.com', password: 'Password123!' });

    const token = loginRes.body.token as string;

    const uploadRes = await request(app)
      .post('/api/drive/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('share me'), { filename: 'share.txt', contentType: 'text/plain' });

    const shareRes = await request(app)
      .post(`/api/drive/items/${uploadRes.body.id}/shares`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: '1234' });

    expect(shareRes.status).toBe(201);

    const publicFail = await request(app).get(`/api/public/share/${shareRes.body.token}`);
    expect(publicFail.status).toBe(404);

    const publicOk = await request(app).get(`/api/public/share/${shareRes.body.token}?password=1234`);
    expect(publicOk.status).toBe(200);
    expect(publicOk.body.name).toBe('share.txt');
  });
});
