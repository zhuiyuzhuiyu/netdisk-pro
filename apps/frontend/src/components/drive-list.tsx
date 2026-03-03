import type { DriveItem } from '../types';

type Props = {
  items: DriveItem[];
  onOpenFolder: (folderId: string) => void;
  onDelete: (itemId: string) => void;
  onRestore: (itemId: string) => void;
  onShare: (itemId: string) => void;
  onRename: (itemId: string, name: string) => void;
  onMove: (itemId: string, targetFolderId: string | null) => void;
  showDeleted: boolean;
  token: string;
};

export const DriveList = ({
  items,
  onOpenFolder,
  onDelete,
  onRestore,
  onShare,
  onRename,
  onMove,
  showDeleted,
  token
}: Props) => {
  const downloadFile = async (itemId: string, name: string) => {
    const url = `${import.meta.env.VITE_API_BASE ?? 'http://localhost:4000'}/api/drive/items/${itemId}/download`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return;
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-panel backdrop-blur">
      <div className="grid grid-cols-[2fr,1fr,1fr] gap-3 border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Name</span>
        <span>Type</span>
        <span>Actions</span>
      </div>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[2fr,1fr,1fr] items-center gap-3 rounded-lg border border-slate-200 p-3">
            <button
              className="truncate text-left hover:text-brand-700"
              onClick={() => item.type === 'FOLDER' && onOpenFolder(item.id)}
            >
              [{item.type === 'FOLDER' ? 'DIR' : 'FILE'}] {item.name}
            </button>
            <span className="text-sm text-slate-600">{item.type}</span>
            <div className="flex flex-wrap gap-2">
              {!showDeleted && (
                <>
                  <button
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => {
                      const name = prompt('New name', item.name);
                      if (name && name !== item.name) onRename(item.id, name);
                    }}
                  >
                    Rename
                  </button>
                  {item.type === 'FILE' && (
                    <>
                      <button
                        className="rounded-md border border-brand-300 px-2 py-1 text-xs"
                        onClick={() => onShare(item.id)}
                      >
                        Share
                      </button>
                      <button
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        onClick={() => {
                          void downloadFile(item.id, item.name);
                        }}
                      >
                        Download
                      </button>
                    </>
                  )}
                  <button
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => {
                      const target = prompt('Target folder id (blank for root)', '');
                      onMove(item.id, target?.trim() ? target : null);
                    }}
                  >
                    Move
                  </button>
                  <button
                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700"
                    onClick={() => onDelete(item.id)}
                  >
                    Delete
                  </button>
                </>
              )}
              {showDeleted && (
                <button
                  className="rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700"
                  onClick={() => onRestore(item.id)}
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No items in this folder</p>}
      </div>
    </div>
  );
};
