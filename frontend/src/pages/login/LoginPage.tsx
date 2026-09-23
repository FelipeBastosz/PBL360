import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { APP_TAGLINE } from '@/assets/brand';
import { AuthCard } from '@/components/layout/AuthCard';
import { AuthShell } from '@/components/layout/AuthShell';
import { BrandHero } from '@/components/layout/BrandHero';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { getPendingVerification } from '@/services/apiError';
import { ROUTES } from '@/routes/paths';
import { validateLoginForm } from '@/utils/authForms';
import { LoginForm } from './LoginForm';

type LocationState = { from?: string } | null;

function redirectTarget(state: unknown): string {
  const from = (state as LocationState)?.from;
  return from && from !== ROUTES.login ? from : ROUTES.home;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { notify } = useToast();
  const form = useForm({ email: '', senha: '' }, validateLoginForm);
  const { run, isLoading, error } = useAsyncAction(login);
  const profileQuery = searchParams.get('perfil') ? `?${searchParams.toString()}` : '';

  async function handleSubmit() {
    if (!form.validateAll()) return;
    const result = await run({ email: form.values.email.trim(), senha: form.values.senha });
    if (result.ok) {
      navigate(redirectTarget(location.state), { replace: true });
      return;
    }
    const pending = getPendingVerification(result.error);
    if (!pending) return;
    notify({ tone: 'info', message: result.error.message });
    navigate(ROUTES.verifyAccount, {
      state: { usuarioId: pending.usuarioId, email: pending.email },
    });
  }

  return (
    <AuthShell>
      <AuthCard>
        <BrandHero
          tagline={APP_TAGLINE}
          markClassName="size-32 text-card"
          discClassName="fill-brand-900"
          className="mb-8 lg:hidden"
        />
        <h1 className="mb-6 hidden text-3xl font-semibold text-ink lg:block">Entrar</h1>
        <LoginForm
          values={form.values}
          errors={form.errors}
          onChange={form.setValue}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          errorMessage={error && !getPendingVerification(error) ? error.message : undefined}
          registerTo={`${ROUTES.register}${profileQuery}`}
        />
      </AuthCard>
    </AuthShell>
  );
}
