'use client';

import { ChangeEvent, useEffect, useState } from 'react';

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
};

type FileItem = {
  id: string;
  name: string;
  folderId: string | null;
  sizeBytes: number;
};

type Share = {
  id: string;
  token: string;
  fileId: string | null;
  folderId: string | null;
  expiresAt: string | null;
};

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || '';
}

export default function DrivePage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [trash, setTrash] = useState<{ files: FileItem[]; folders: Folder[] }>({ files: [], folders: [] });
  const [currentFolderId, setCurrentFolderId] = useState<string>('');
  const [usedBytes, setUsedBytes] = useState(0);
  const [newFolderName, setNewFolderName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  async function authedJson(url: string, init: RequestInit = {}) {
    const token = getToken();
    const res = await fetch(url, {
      ...init,
      headers: {
        ...(init.headers || {}),
        authorization: `Bearer ${token}`
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || `request failed: ${res.status}`);
    }
    return data;
  }

  async function loadAll() {
    setBusy(true);
    setError('');
    try {
      const [folderData, fileData, quotaData, shareData, trashData] = await Promise.all([
        authedJson('/api/folders'),
        authedJson(`/api/files?folderId=${encodeURIComponent(currentFolderId)}`),
        authedJson('/api/quota'),
        authedJson('/api/share'),
        authedJson('/api/trash')
      ]);

      setFolders(folderData.items || []);
      setFiles(fileData.items || []);
      setUsedBytes(quotaData.usedBytes || 0);
      setShares(shareData.items || []);
      setTrash({ files: trashData.files || [], folders: trashData.folders || [] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      window.location.href = '/login';
      return;
    }
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  async function createFolder() {
    if (!newFolderName.trim()) return;
    await authedJson('/api/folders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: newFolderName, parentId: currentFolderId || null })
    });
    setNewFolderName('');
    await loadAll();
  }

  async function uploadFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    form.append('folderId', currentFolderId || '');

    const res = await fetch('/api/files/upload', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: form
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'upload failed');
      return;
    }
    await loadAll();
  }

  async function deleteFile(id: string) {
    await authedJson('/api/files', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadAll();
  }

  async function renameFile(id: string, oldName: string) {
    const name = window.prompt('新文件名', oldName);
    if (!name) return;
    await authedJson('/api/files', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, name })
    });
    await loadAll();
  }

  async function moveFile(id: string) {
    const folderId = window.prompt('目标文件夹 ID，留空移动到根目录', '');
    if (folderId === null) return;
    await authedJson('/api/files', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, folderId })
    });
    await loadAll();
  }

  async function deleteFolder(id: string) {
    await authedJson('/api/folders', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadAll();
  }

  async function renameFolder(id: string, oldName: string) {
    const name = window.prompt('新文件夹名', oldName);
    if (!name) return;
    await authedJson('/api/folders', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, name })
    });
    await loadAll();
  }

  async function moveFolder(id: string) {
    const parentId = window.prompt('目标父文件夹 ID，留空移动到根目录', '');
    if (parentId === null) return;
    await authedJson('/api/folders', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, parentId })
    });
    await loadAll();
  }

  async function restore(type: 'file' | 'folder', id: string) {
    await authedJson('/api/trash/restore', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type, id })
    });
    await loadAll();
  }

  async function createShare(input: { fileId?: string; folderId?: string }) {
    const password = window.prompt('分享密码（可留空）', '') || '';
    const expiresAt = window.prompt('过期时间 ISO（可留空）', '') || '';

    await authedJson('/api/share', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...input, password: password || undefined, expiresAt: expiresAt || undefined })
    });

    await loadAll();
  }

  async function deleteShare(id: string) {
    await authedJson('/api/share', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id })
    });
    await loadAll();
  }

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">CloudDrive Pro</h1>
        <div className="flex items-center gap-3 text-sm">
          <span>已用空间: {usedBytes} bytes</span>
          <button
            className="rounded border px-3 py-1"
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
            type="button"
          >
            退出
          </button>
        </div>
      </header>

      {error ? <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}

      <section className="rounded border p-4">
        <h2 className="mb-2 text-lg font-semibold">当前目录: {currentFolderId || '根目录'}</h2>
        <div className="flex flex-wrap gap-2">
          <input
            className="rounded border p-2"
            placeholder="新建文件夹名称"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <button className="rounded bg-black px-3 py-2 text-white" onClick={createFolder} type="button">
            新建文件夹
          </button>
          <label className="rounded border px-3 py-2">
            上传文件
            <input className="hidden" type="file" onChange={uploadFile} />
          </label>
          <button className="rounded border px-3 py-2" onClick={() => setCurrentFolderId('')} type="button">
            返回根目录
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded border p-4">
          <h3 className="mb-2 text-lg font-semibold">文件夹树</h3>
          <ul className="space-y-2 text-sm">
            {folders.map((folder) => (
              <li key={folder.id} className="rounded border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="underline" onClick={() => setCurrentFolderId(folder.id)} type="button">
                    {folder.name}
                  </button>
                  <code className="text-xs">{folder.id}</code>
                  <button className="rounded border px-2" onClick={() => renameFolder(folder.id, folder.name)} type="button">
                    重命名
                  </button>
                  <button className="rounded border px-2" onClick={() => moveFolder(folder.id)} type="button">
                    移动
                  </button>
                  <button className="rounded border px-2" onClick={() => createShare({ folderId: folder.id })} type="button">
                    分享
                  </button>
                  <button className="rounded border px-2" onClick={() => deleteFolder(folder.id)} type="button">
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded border p-4">
          <h3 className="mb-2 text-lg font-semibold">文件列表</h3>
          <ul className="space-y-2 text-sm">
            {files.map((file) => (
              <li key={file.id} className="rounded border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{file.name}</span>
                  <span>{file.sizeBytes} bytes</span>
                  <a className="underline" href={`/api/files/${file.id}/download`}>
                    下载
                  </a>
                  <button className="rounded border px-2" onClick={() => renameFile(file.id, file.name)} type="button">
                    重命名
                  </button>
                  <button className="rounded border px-2" onClick={() => moveFile(file.id)} type="button">
                    移动
                  </button>
                  <button className="rounded border px-2" onClick={() => createShare({ fileId: file.id })} type="button">
                    分享
                  </button>
                  <button className="rounded border px-2" onClick={() => deleteFile(file.id)} type="button">
                    删除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded border p-4">
        <h3 className="mb-2 text-lg font-semibold">分享管理</h3>
        <ul className="space-y-2 text-sm">
          {shares.map((share) => {
            const link = `${origin}/s/${share.token}`;
            return (
              <li key={share.id} className="rounded border p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <code>{share.token}</code>
                  <a className="underline" href={link} target="_blank" rel="noreferrer">
                    打开分享页
                  </a>
                  <button
                    className="rounded border px-2"
                    onClick={() => {
                      void navigator.clipboard?.writeText(link);
                    }}
                    type="button"
                  >
                    复制链接
                  </button>
                  <button className="rounded border px-2" onClick={() => deleteShare(share.id)} type="button">
                    删除分享
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded border p-4">
        <h3 className="mb-2 text-lg font-semibold">回收站</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <h4 className="font-medium">已删除文件</h4>
            <ul className="space-y-2 text-sm">
              {trash.files.map((f) => (
                <li key={f.id} className="flex items-center gap-2">
                  <span>{f.name}</span>
                  <button className="rounded border px-2" onClick={() => restore('file', f.id)} type="button">
                    恢复
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium">已删除文件夹</h4>
            <ul className="space-y-2 text-sm">
              {trash.folders.map((f) => (
                <li key={f.id} className="flex items-center gap-2">
                  <span>{f.name}</span>
                  <button className="rounded border px-2" onClick={() => restore('folder', f.id)} type="button">
                    恢复
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {busy ? <p className="text-sm text-gray-500">加载中...</p> : null}
    </main>
  );
}
