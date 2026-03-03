'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.message || 'register failed');
      return;
    }

    router.push('/login');
  }

  return (
    <main className="mx-auto mt-16 max-w-md space-y-4 rounded border p-6">
      <h1 className="text-xl font-semibold">注册</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded border p-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Password (min 6)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="w-full rounded bg-black p-2 text-white" disabled={loading} type="submit">
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <a className="text-sm text-blue-600" href="/login">
        已有账号？去登录
      </a>
    </main>
  );
}
