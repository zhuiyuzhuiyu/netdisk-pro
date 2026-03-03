import { useEffect, useState } from 'react';
import {
  createFolder,
  deleteItem,
  fetchFolderTree,
  fetchItems,
  fetchQuota,
  renameItem,
  restoreItem,
  uploadFile,
  moveItem
} from '../api/drive';
import { useAuth } from '../contexts/auth-context';
import type { DriveItem } from '../types';
import { FolderTree } from '../components/folder-tree';
import { DriveList } from '../components/drive-list';
import { ShareModal } from '../components/share-modal';

export const DrivePage = () => {
  const { token, email, clearAuth } = useAuth();
  const [folders, setFolders] = useState<DriveItem[]>([]);
  const [items, setItems] = useState<DriveItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [shareFor, setShareFor] = useState<string | null>(null);
  const [quotaText, setQuotaText] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    if (!token) return;
    try {
      const [tree, list, quota] = await Promise.all([
        fetchFolderTree(token),
        fetchItems(token, currentFolderId, showDeleted),
        fetchQuota(token)
      ]);
      setFolders(tree.folders);
      setItems(list.items);
      setQuotaText(`${(quota.usedBytes / 1024 / 1024).toFixed(2)}MB / ${(quota.maxBytes / 1024 / 1024).toFixed(0)}MB`);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    refresh();
  }, [currentFolderId, showDeleted]);

  if (!token) return null;

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 px-4 py-6 lg:grid-cols-[280px,1fr]">
      <FolderTree folders={folders} currentFolderId={currentFolderId} onSelect={setCurrentFolderId} />
      <section className="space-y-4">
        <header className="rounded-2xl bg-white/80 p-4 shadow-panel backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-brand-900">My Drive</h1>
              <p className="text-sm text-slate-600">{email} · Quota {quotaText}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                onClick={() => setShowDeleted((value) => !value)}
              >
                {showDeleted ? 'View Active' : 'Recycle Bin'}
              </button>
              <button
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                onClick={async () => {
                  const name = prompt('Folder name');
                  if (!name) return;
                  await createFolder(token, name, currentFolderId);
                  await refresh();
                }}
              >
                New Folder
              </button>
              <label className="cursor-pointer rounded-lg bg-brand-700 px-3 py-2 text-sm text-white hover:bg-brand-900">
                Upload
                <input
                  className="hidden"
                  type="file"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    await uploadFile(token, file, currentFolderId);
                    await refresh();
                  }}
                />
              </label>
              <button className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700" onClick={clearAuth}>
                Logout
              </button>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </header>

        <DriveList
          items={items}
          token={token}
          showDeleted={showDeleted}
          onOpenFolder={setCurrentFolderId}
          onDelete={async (itemId) => {
            await deleteItem(token, itemId);
            await refresh();
          }}
          onRestore={async (itemId) => {
            await restoreItem(token, itemId);
            await refresh();
          }}
          onShare={setShareFor}
          onRename={async (itemId, name) => {
            await renameItem(token, itemId, name);
            await refresh();
          }}
          onMove={async (itemId, targetFolderId) => {
            await moveItem(token, itemId, targetFolderId);
            await refresh();
          }}
        />
      </section>

      {shareFor && <ShareModal open itemId={shareFor} token={token} onClose={() => setShareFor(null)} />}
    </main>
  );
};
