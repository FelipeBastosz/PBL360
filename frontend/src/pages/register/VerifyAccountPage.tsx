import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FlowBrand } from '@/components/layout/FlowBrand';
import { FlowShell } from '@/components/layout/FlowShell';
import { CodeForm } from '@/components/ui/CodeForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/routes/paths';
import { readStringFields } from '@/utils/navigationState';

const STATE_KEYS = ['usuarioId', 'email'] as const;

export default function VerifyAccountPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const pending = readStringFields(useLocation().state, STATE_KEYS);
  const verification = useAsyncAction(authService.verifyEmailCode);
  const resend = useAsyncAction(authService.resendVerificationCode);

  if (!pending) return <Navigate to={ROUTES.register} replace />;

  async function handleSubmit(codigo: string) {
    if (!pending) return;
    const result = await verification.run({ ...pending, codigo });
    if (result.ok) navigate(ROUTES.registerSuccess, { replace: true, state: { concluido: true } });
  }

  async function handleResend() {
    const result = await resend.run({ email: pending?.email ?? '' });
    notify(
      result.ok
        ? { tone: 'success', message: 'Enviamos um novo código para o seu e-mail.' }
        : { tone: 'error', message: result.error.message },
    );
    return result.ok;
  }

  return (
    <FlowShell title="Confirmar e-mail" backTo={ROUTES.login} backLabel="Voltar para o login">
      <FlowBrand />
      <CodeForm
        hint={`Informe o código de 6 dígitos enviado para ${pending.email}.`}
        placeholder="Código de verificação"
        onSubmit={handleSubmit}
        isLoading={verification.isLoading}
        errorMessage={verification.error?.message}
        onResend={handleResend}
        isResending={resend.isLoading}
      />
    </FlowShell>
  );
}
