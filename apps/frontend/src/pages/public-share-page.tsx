import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch, getApiBase } from '../api/client';

export const PublicSharePage = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState('');

  const handleLookup = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const meta = await apiFetch<{ name: string; size: number }>(
        `/api/public/share/${token}?${password ? `password=${encodeURIComponent(password)}` : ''}`
      );
      setFile(meta);
    } catch (e) {
      setError((e as Error).message);
      setFile(null);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white/90 p-6 shadow-panel">
        <h1 className="text-xl font-semibold text-brand-900">Shared File</h1>
        <p className="text-sm text-slate-600">Enter password if needed to view and download.</p>

        <form className="mt-4 flex gap-2" onSubmit={handleLookup}>
          <input
            className="flex-1 rounded-lg border-slate-300"
            placeholder="Password (optional)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="rounded-lg bg-brand-700 px-4 py-2 text-white">Load</button>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        {file && (
          <div className="mt-4 rounded-lg border border-slate-200 p-4">
            <p className="font-medium">{file.name}</p>
            <p className="text-sm text-slate-600">{(file.size / 1024).toFixed(2)} KB</p>
            <a
              className="mt-3 inline-block rounded-lg border border-brand-300 px-3 py-2 text-sm text-brand-700"
              href={`${getApiBase()}/api/public/share/${token}/download${password ? `?password=${encodeURIComponent(password)}` : ''}`}
            >
              Download
            </a>
          </div>
        )}
      </div>
    </main>
  );
};
