import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/layout/PageLoader';
import { TermsReacceptanceModal } from '@/components/layout/TermsReacceptanceModal';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import {
  commitmentTermsService,
  type TermAcceptanceStatus,
} from '@/services/commitmentTerms.service';
import { ROUTES } from './paths';

type TermsCheckState =
  | { userId: string; status: 'loading' }
  | { userId: string; status: 'verified' }
  | { userId: string; status: 'pending'; acceptance: TermAcceptanceStatus }
  | { userId: string; status: 'error' };

function clearLoginCheckPending(): void {
  try {
    sessionStorage.removeItem('pbl360.checkTermsOnLogin');
  } catch {
    // ignore
  }
}

function isAcceptancePending(data: TermAcceptanceStatus): boolean {
  return !data.aceito || Boolean(data.versaoAceita && data.versaoAceita !== data.versaoVigente);
}

function useTermsAcceptanceCheck(isAuthenticated: boolean, currentUserId: string) {
  const [state, setState] = useState<TermsCheckState>(() => ({
    userId: currentUserId,
    status: 'loading',
  }));
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    Promise.resolve(commitmentTermsService.getMyAcceptanceStatus?.())
      .then((data) => {
        if (!active) return;
        if (!data) {
          setState({ userId: currentUserId, status: 'error' });
          return;
        }
        if (isAcceptancePending(data)) {
          setState({ userId: currentUserId, status: 'pending', acceptance: data });
          return;
        }
        clearLoginCheckPending();
        setState({ userId: currentUserId, status: 'verified' });
      })
      .catch(() => {
        if (active) setState({ userId: currentUserId, status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, currentUserId, retryCount]);

  function retry() {
    setState({ userId: currentUserId, status: 'loading' });
    setRetryCount((count) => count + 1);
  }

  function markAccepted() {
    clearLoginCheckPending();
    setState({ userId: currentUserId, status: 'verified' });
  }

  const effectiveState: TermsCheckState =
    state.userId === currentUserId ? state : { userId: currentUserId, status: 'loading' };

  return { state: effectiveState, retry, markAccepted };
}

function TermsCheckErrorCard({ onRetry, onLogout }: { onRetry: () => void; onLogout: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <h1 className="text-lg font-semibold text-ink">Não foi possível verificar os termos</h1>
        <Alert tone="error" className="mt-4 text-xs">
          Não foi possível consultar o status dos Termos de Uso e Política de Privacidade. Tente
          novamente para continuar.
        </Alert>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onLogout}>
            Sair da conta
          </Button>
          <Button type="button" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const currentUserId = user?.id ?? '__authenticated__';
  const { state, retry, markAccepted } = useTermsAcceptanceCheck(isAuthenticated, currentUserId);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }
  if (state.status === 'loading') {
    return <PageLoader />;
  }
  if (state.status === 'error') {
    return <TermsCheckErrorCard onRetry={retry} onLogout={logout} />;
  }
  if (state.status === 'pending') {
    return (
      <TermsReacceptanceModal
        isOpen={true}
        currentVersion={state.acceptance.versaoVigente}
        previousVersion={state.acceptance.versaoAceita}
        onAccepted={markAccepted}
        onLogout={logout}
      />
    );
  }
  return <Outlet />;
}

export default ProtectedRoute;
