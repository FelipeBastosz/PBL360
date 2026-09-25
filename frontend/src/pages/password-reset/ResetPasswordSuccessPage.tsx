import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FlowShell } from '@/components/layout/FlowShell';
import { Button } from '@/components/ui/Button';
import { SuccessState } from '@/components/ui/SuccessState';
import { ROUTES } from '@/routes/paths';

export default function ResetPasswordSuccessPage() {
  const navigate = useNavigate();
  const state = useLocation().state as { concluido?: boolean } | null;

  if (!state?.concluido) return <Navigate to={ROUTES.login} replace />;

  return (
    <FlowShell title="Recuperar Senha" backTo={ROUTES.login} backLabel="Voltar para o login">
      <div className="pt-16 lg:pt-4">
        <SuccessState
          title="Senha alterada com sucesso!"
          action={
            <Button onClick={() => navigate(ROUTES.login, { replace: true })}>
              Voltar para o login
            </Button>
          }
        />
      </div>
    </FlowShell>
  );
}
