import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import './index.css';
import { AuthProvider, useAuth } from './contexts/auth-context';
import { AuthPage } from './pages/auth-page';
import { DrivePage } from './pages/drive-page';
import { PublicSharePage } from './pages/public-share-page';

const ProtectedRoute = () => {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

const router = createBrowserRouter([
  { path: '/login', element: <AuthPage mode="login" /> },
  { path: '/register', element: <AuthPage mode="register" /> },
  { path: '/share/:token', element: <PublicSharePage /> },
  {
    element: <ProtectedRoute />,
    children: [{ path: '/', element: <DrivePage /> }]
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
