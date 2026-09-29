import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthCard } from '@/components/layout/AuthCard';
import { AuthShell } from '@/components/layout/AuthShell';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useForm } from '@/hooks/useForm';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/routes/paths';
import {
  type RegisterFormValues,
  toRegisterPayload,
  validateRegisterForm,
} from '@/utils/authForms';
import { parseProfileParam, toProfileParam } from '@/utils/profile';
import { RegisterForm } from './RegisterForm';

function initialValues(profileParam: string | null): RegisterFormValues {
  return {
    tipo: parseProfileParam(profileParam) ?? 'ALUNO',
    nome: '',
    email: '',
    matricula: '',
    foto: null,
    senha: '',
    confirmacao: '',
  };
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const form = useForm(initialValues(searchParams.get('perfil')), validateRegisterForm);
  const { run, isLoading, error } = useAsyncAction(authService.register);

  async function handleSubmit() {
    if (!form.validateAll()) return;
    const result = await run(toRegisterPayload(form.values));
    if (!result.ok) return;
    navigate(ROUTES.verifyAccount, {
      state: { usuarioId: result.data.usuarioId, email: result.data.usuario.email },
    });
  }

  return (
    <AuthShell>
      <AuthCard>
        <h1 className="text-[1.75rem] font-semibold text-ink">Criar conta</h1>
        <p className="mt-1 mb-8 text-brand-300">Preencha seus dados para acessar a plataforma.</p>
        <RegisterForm
          values={form.values}
          errors={form.errors}
          onChange={form.setValue}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          errorMessages={error?.messages}
        />
        <p className="mt-8 text-center text-sm text-muted">
          Já tem conta?{' '}
          <Link
            to={`${ROUTES.login}?perfil=${toProfileParam(form.values.tipo)}`}
            className="text-brand-900 hover:underline"
          >
            Entrar
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
