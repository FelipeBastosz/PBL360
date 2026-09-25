import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FlowBrand } from '@/components/layout/FlowBrand';
import { FlowShell } from '@/components/layout/FlowShell';
import { CodeForm } from '@/components/ui/CodeForm';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/routes/paths';
import { readStringFields } from '@/utils/navigationState';

const STATE_KEYS = ['email'] as const;

export default function ResetPasswordCodePage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const pending = readStringFields(useLocation().state, STATE_KEYS);
  const validation = useAsyncAction(authService.validatePasswordResetCode);
  const resend = useAsyncAction(authService.requestPasswordReset);

  if (!pending) return <Navigate to={ROUTES.forgotPassword} replace />;

  async function handleSubmit(codigo: string) {
    if (!pending) return;
    const result = await validation.run({ email: pending.email, codigo });
    if (result.ok) {
      navigate(ROUTES.resetPassword, {
        replace: true,
        state: { email: pending.email, token: result.data.token },
      });
    }
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
    <FlowShell title="Recuperar Senha" backTo={ROUTES.forgotPassword} backLabel="Voltar">
      <FlowBrand />
      <CodeForm
        hint="Informe o código de recuperação recebido no email."
        placeholder="Código de recuperação"
        onSubmit={handleSubmit}
        isLoading={validation.isLoading}
        errorMessage={validation.error?.message}
        onResend={handleResend}
        isResending={resend.isLoading}
      />
    </FlowShell>
  );
}
