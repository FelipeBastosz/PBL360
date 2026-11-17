import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { TermsReacceptanceModal } from '@/components/layout/TermsReacceptanceModal';
import { useAuth } from '@/hooks/useAuth';
import {
  commitmentTermsService,
  type TermAcceptanceStatus,
} from '@/services/commitmentTerms.service';
import { ROUTES } from './paths';

function isLoginCheckPending(): boolean {
  try {
    return sessionStorage.getItem('pbl360.checkTermsOnLogin') === 'true';
  } catch {
    return false;
  }
}

function clearLoginCheckPending(): void {
  try {
    sessionStorage.removeItem('pbl360.checkTermsOnLogin');
  } catch {
    // ignore
  }
}

function useTermsReacceptanceOnLogin(isAuthenticated: boolean) {
  const [termsStatus, setTermsStatus] = useState<TermAcceptanceStatus | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isLoginCheckPending()) return;

    let isMounted = true;
    commitmentTermsService
      .getMyAcceptanceStatus?.()
      ?.then((data) => {
        if (!isMounted || !data) return;
        if (!data.aceito || (data.versaoAceita && data.versaoAceita !== data.versaoVigente)) {
          setTermsStatus(data);
        } else {
          clearLoginCheckPending();
        }
      })
      .catch(() => {
        clearLoginCheckPending();
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  function clearTermsStatus() {
    clearLoginCheckPending();
    setTermsStatus(null);
  }

  return { termsStatus, clearTermsStatus };
}

export function ProtectedRoute() {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const { termsStatus, clearTermsStatus } = useTermsReacceptanceOnLogin(isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  const needsReacceptance = Boolean(termsStatus);

  return (
    <>
      {needsReacceptance && (
        <TermsReacceptanceModal
          isOpen={true}
          currentVersion={termsStatus!.versaoVigente}
          previousVersion={termsStatus!.versaoAceita}
          onAccepted={clearTermsStatus}
          onLogout={logout}
        />
      )}
      {!needsReacceptance ? <Outlet /> : null}
    </>
  );
}

export default ProtectedRoute;
