import { apiFetch } from './client';

export const register = (email: string, password: string) =>
  apiFetch<{ id: string; email: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

export const login = (email: string, password: string) =>
  apiFetch<{ token: string; user: { id: string; email: string } }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

export const me = (token: string) => apiFetch<{ user: { id: string; email: string } }>('/api/auth/me', {}, token);
