import { apiFetch } from './client';
import type { DriveItem, ShareLink } from '../types';

export const fetchFolderTree = (token: string) => apiFetch<{ folders: DriveItem[] }>('/api/drive/tree', {}, token);

export const fetchItems = (token: string, folderId: string | null, includeDeleted = false) => {
  const params = new URLSearchParams();
  if (folderId) params.set('folderId', folderId);
  if (includeDeleted) params.set('includeDeleted', 'true');
  return apiFetch<{ items: DriveItem[] }>(`/api/drive/items?${params.toString()}`, {}, token);
};

export const createFolder = (token: string, name: string, parentId: string | null) =>
  apiFetch<DriveItem>(
    '/api/drive/folders',
    { method: 'POST', body: JSON.stringify({ name, parentId }) },
    token
  );

export const renameItem = (token: string, itemId: string, name: string) =>
  apiFetch<DriveItem>(
    `/api/drive/items/${itemId}/rename`,
    { method: 'PATCH', body: JSON.stringify({ name }) },
    token
  );

export const moveItem = (token: string, itemId: string, targetParentId: string | null) =>
  apiFetch<DriveItem>(
    `/api/drive/items/${itemId}/move`,
    { method: 'PATCH', body: JSON.stringify({ targetParentId }) },
    token
  );

export const deleteItem = (token: string, itemId: string) =>
  apiFetch<void>(`/api/drive/items/${itemId}`, { method: 'DELETE' }, token);

export const restoreItem = (token: string, itemId: string) =>
  apiFetch<void>(`/api/drive/items/${itemId}/restore`, { method: 'POST' }, token);

export const purgeItem = (token: string, itemId: string) =>
  apiFetch<void>(`/api/drive/items/${itemId}/purge`, { method: 'DELETE' }, token);

export const uploadFile = async (token: string, file: File, parentId: string | null) => {
  const body = new FormData();
  body.append('file', file);
  if (parentId) body.append('parentId', parentId);

  return apiFetch<DriveItem>('/api/drive/upload', { method: 'POST', body }, token);
};

export const fetchQuota = (token: string) =>
  apiFetch<{ usedBytes: number; maxBytes: number; usagePercent: number; fileCount: number }>('/api/drive/quota', {}, token);

export const createShare = (token: string, itemId: string, password?: string, expiresAt?: string) =>
  apiFetch<ShareLink>(
    `/api/drive/items/${itemId}/shares`,
    { method: 'POST', body: JSON.stringify({ password, expiresAt }) },
    token
  );

export const listShares = (token: string, itemId: string) =>
  apiFetch<{ links: ShareLink[] }>(`/api/drive/items/${itemId}/shares`, {}, token);

export const revokeShare = (token: string, linkId: string) =>
  apiFetch<void>(`/api/drive/shares/${linkId}`, { method: 'DELETE' }, token);
