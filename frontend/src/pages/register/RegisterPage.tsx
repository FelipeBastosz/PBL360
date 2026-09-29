import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FlowShell } from '@/components/layout/FlowShell';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useForm } from '@/hooks/useForm';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/routes/paths';
import {
  type RegisterFormValues,
  toRegisterPayload,
  validateRegisterForm,
} from '@/utils/authForms';
import { parseProfileParam, profileLabel, toProfileParam } from '@/utils/profile';
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
  const profile = form.values.tipo;

  async function handleSubmit() {
    if (!form.validateAll()) return;
    const result = await run(toRegisterPayload(form.values));
    if (!result.ok) return;
    navigate(ROUTES.verifyAccount, {
      state: { usuarioId: result.data.usuarioId, email: result.data.usuario.email },
    });
  }

  return (
    <FlowShell
      title="Criar conta"
      subtitle={`Cadastro de ${profileLabel(profile).toLowerCase()}`}
      backTo={ROUTES.profileSelection}
      backLabel="Voltar para a escolha de perfil"
    >
      <RegisterForm
        values={form.values}
        errors={form.errors}
        onChange={form.setValue}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        errorMessages={error?.messages}
      />
      <p className="mt-6 text-center text-base font-semibold text-brand-300 animate-fade-up [animation-delay:420ms]">
        Já tem conta?{' '}
        <Link
          to={`${ROUTES.login}?perfil=${toProfileParam(profile)}`}
          className="text-brand-900 underline-offset-4 hover:underline"
        >
          Entrar
        </Link>
      </p>
    </FlowShell>
  );
}
