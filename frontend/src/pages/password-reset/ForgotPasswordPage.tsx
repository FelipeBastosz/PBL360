import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowBrand } from '@/components/layout/FlowBrand';
import { FlowShell } from '@/components/layout/FlowShell';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useForm } from '@/hooks/useForm';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/routes/paths';
import { validateEmailForm } from '@/utils/authForms';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const form = useForm({ email: '' }, validateEmailForm);
  const { run, isLoading, error } = useAsyncAction(authService.requestPasswordReset);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.validateAll()) return;
    const email = form.values.email.trim();
    const result = await run({ email });
    if (result.ok) navigate(ROUTES.resetPasswordCode, { state: { email } });
  }

  return (
    <FlowShell title="Recuperar Senha" backTo={ROUTES.login} backLabel="Voltar para o login">
      <FlowBrand />
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
        {error && <Alert tone="error">{error.message}</Alert>}
        <TextField
          label="Email Institucional"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seuemail@exemplo.com"
          hint="Digite o e-mail associado à sua conta e enviaremos as instruções para criar uma nova senha."
          value={form.values.email}
          onChange={(value) => form.setValue('email', value)}
          error={form.errors.email}
          autoFocus
        />
        <Button type="submit" isLoading={isLoading} className="mt-8">
          Enviar
        </Button>
      </form>
    </FlowShell>
  );
}
