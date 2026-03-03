import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { me } from '../api/auth';

type AuthContextValue = {
  token: string | null;
  email: string | null;
  setAuth: (token: string, email: string) => void;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'clouddrive_token';
const EMAIL_KEY = 'clouddrive_email';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [email, setEmail] = useState<string | null>(() => localStorage.getItem(EMAIL_KEY));

  useEffect(() => {
    if (!token) return;

    me(token).catch(() => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EMAIL_KEY);
      setToken(null);
      setEmail(null);
    });
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      email,
      setAuth: (nextToken, nextEmail) => {
        localStorage.setItem(TOKEN_KEY, nextToken);
        localStorage.setItem(EMAIL_KEY, nextEmail);
        setToken(nextToken);
        setEmail(nextEmail);
      },
      clearAuth: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
        setToken(null);
        setEmail(null);
      }
    }),
    [email, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
