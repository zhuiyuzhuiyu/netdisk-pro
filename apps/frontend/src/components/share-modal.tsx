import { useEffect, useState } from 'react';
import { createShare, listShares, revokeShare } from '../api/drive';
import type { ShareLink } from '../types';

type Props = {
  open: boolean;
  itemId: string;
  token: string;
  onClose: () => void;
};

export const ShareModal = ({ open, itemId, token, onClose }: Props) => {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  const refresh = async () => {
    const data = await listShares(token, itemId);
    setLinks(data.links);
  };

  useEffect(() => {
    if (!open) return;
    refresh().catch((e: Error) => setError(e.message));
  }, [open]);

  if (!open) return null;
  const shareBase = window.location.origin;

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-slate-900/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-panel">
        <h3 className="text-lg font-semibold">Share Links</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            className="rounded-lg border-slate-300"
            placeholder="Password (optional)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <input
            className="rounded-lg border-slate-300"
            type="datetime-local"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
          <button
            className="rounded-lg bg-brand-700 px-4 py-2 text-white hover:bg-brand-900"
            onClick={async () => {
              try {
                await createShare(token, itemId, password || undefined, expiresAt ? new Date(expiresAt).toISOString() : undefined);
                setPassword('');
                setExpiresAt('');
                await refresh();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            Create Link
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="text-sm font-medium">{shareBase}/share/{link.token}</p>
                <p className="text-xs text-slate-500">
                  {link.expiresAt ? `Expires ${new Date(link.expiresAt).toLocaleString()}` : 'No expiry'}
                </p>
              </div>
              <button
                className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700"
                onClick={async () => {
                  await revokeShare(token, link.id);
                  await refresh();
                }}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button className="rounded-lg border border-slate-300 px-4 py-2" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
