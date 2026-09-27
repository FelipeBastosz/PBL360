import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FlowBrand } from '@/components/layout/FlowBrand';
import { FlowShell } from '@/components/layout/FlowShell';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useForm } from '@/hooks/useForm';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/routes/paths';
import { validateNewPasswordForm } from '@/utils/authForms';
import { readStringFields } from '@/utils/navigationState';
import { ResetPasswordForm } from './ResetPasswordForm';

const STATE_KEYS = ['token'] as const;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const pending = readStringFields(useLocation().state, STATE_KEYS);
  const form = useForm({ senha: '', confirmacao: '' }, validateNewPasswordForm);
  const { run, isLoading, error } = useAsyncAction(authService.resetPassword);

  if (!pending) return <Navigate to={ROUTES.forgotPassword} replace />;

  async function handleSubmit() {
    if (!form.validateAll() || !pending) return;
    const result = await run({ token: pending.token, novaSenha: form.values.senha });
    if (result.ok) {
      navigate(ROUTES.resetPasswordSuccess, { replace: true, state: { concluido: true } });
    }
  }

  return (
    <FlowShell title="Recuperar Senha" backTo={ROUTES.forgotPassword} backLabel="Voltar">
      <FlowBrand />
      <ResetPasswordForm
        values={form.values}
        errors={form.errors}
        onChange={form.setValue}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        errorMessage={error?.message}
      />
    </FlowShell>
  );
}
