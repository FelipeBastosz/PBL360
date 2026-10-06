import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from './paths';

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Navigate to={ROUTES.rooms} replace /> : <Outlet />;
}
