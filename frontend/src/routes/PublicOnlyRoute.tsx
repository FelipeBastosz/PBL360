import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from './paths';

type LocationState = { from?: string } | null;

function redirectTarget(state: unknown): string {
  const from = (state as LocationState)?.from;
  return from && from !== ROUTES.login ? from : ROUTES.rooms;
}

export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return isAuthenticated ? <Navigate to={redirectTarget(location.state)} replace /> : <Outlet />;
}
