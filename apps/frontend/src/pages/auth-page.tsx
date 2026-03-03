import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';
import { useAuth } from '../contexts/auth-context';

export const AuthPage = ({ mode }: { mode: 'login' | 'register' }) => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const isRegister = mode === 'register';

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      if (isRegister) {
        await register(email, password);
      }
      const result = await login(email, password);
      setAuth(result.token, result.user.email);
      navigate('/');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-panel backdrop-blur">
        <h1 className="text-2xl font-semibold text-brand-900">CloudDrive Pro</h1>
        <p className="mt-1 text-sm text-slate-600">{isRegister ? 'Create your workspace' : 'Sign in to continue'}</p>
        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-lg border-slate-300"
            placeholder="you@company.com"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border-slate-300"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-lg bg-brand-700 px-4 py-2 text-white hover:bg-brand-900" type="submit">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          {isRegister ? 'Already registered?' : 'Need an account?'}{' '}
          <Link className="font-semibold text-brand-700" to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Login' : 'Register'}
          </Link>
        </p>
      </div>
    </main>
  );
};
