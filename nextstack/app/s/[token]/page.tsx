'use client';

import { FormEvent, useEffect, useState } from 'react';

type Props = {
  params: Promise<{ token: string }>;
};

export default function SharePublicPage({ params }: Props) {
  const [token, setToken] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [payload, setPayload] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then((p) => setToken(p.token)).catch(() => setError('invalid token'));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/share/${token}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'failed');
        setRequiresPassword(!!data.requiresPassword);
      })
      .catch((e) => setError((e as Error).message));
  }, [token]);

  async function accessShare(e: FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch(`/api/share/${token}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || 'access failed');
      return;
    }

    setPayload(data);
  }

  return (
    <main className="mx-auto mt-12 max-w-3xl space-y-4 rounded border p-6">
      <h1 className="text-2xl font-bold">公开分享访问</h1>
      <p className="text-sm text-gray-600">Token: {token}</p>

      {payload ? null : (
        <form className="space-y-3" onSubmit={accessShare}>
          {requiresPassword ? (
            <input
              className="w-full rounded border p-2"
              placeholder="请输入分享密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          ) : (
            <p className="text-sm">该分享无需密码，点击下方按钮加载内容。</p>
          )}
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            访问分享内容
          </button>
        </form>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {payload?.type === 'file' ? (
        <section className="space-y-2 rounded border p-3 text-sm">
          <h2 className="font-semibold">文件分享</h2>
          <p>{payload.file.name}</p>
          <a className="underline" href={payload.file.downloadUrl}>
            下载文件
          </a>
        </section>
      ) : null}

      {payload?.type === 'folder' ? (
        <section className="space-y-2 rounded border p-3 text-sm">
          <h2 className="font-semibold">文件夹分享: {payload.folder.name}</h2>
          <ul className="space-y-2">
            {payload.files.map((f: any) => (
              <li key={f.id} className="flex items-center gap-2">
                <span>{f.name}</span>
                <a className="underline" href={`${payload.downloadUrlTemplate}${f.id}`}>
                  下载
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
