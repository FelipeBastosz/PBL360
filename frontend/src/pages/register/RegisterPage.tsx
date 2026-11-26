import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FlowShell } from '@/components/layout/FlowShell';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useCurrentTerm } from '@/hooks/useCurrentTerm';
import { useForm } from '@/hooks/useForm';
import { ROUTES } from '@/routes/paths';
import { authService } from '@/services/auth.service';
import type { CurrentCommitmentTerm } from '@/services/commitmentTerms.service';
import {
  type RegisterFormValues,
  toRegisterPayload,
  validateRegisterForm,
} from '@/utils/authForms';
import { parseProfileParam, profileLabel } from '@/utils/profile';
import { RegisterForm } from './RegisterForm';

const TERMS_UPDATED_CONFLICT_MESSAGE =
  'Os Termos de Uso e Política de Privacidade foram atualizados. Leia a versão atualizada e confirme o aceite novamente para concluir o cadastro.';

function initialValues(profileParam: string | null): RegisterFormValues {
  return {
    tipo: parseProfileParam(profileParam) ?? 'ALUNO',
    nome: '',
    email: '',
    matricula: '',
    foto: null,
    senha: '',
    confirmacao: '',
    termosAceitos: false,
  };
}

function isSameVersionDuplicateAccountConflict(
  messages: string[],
  submittedVersion: string,
  updatedTerm: CurrentCommitmentTerm | null,
): boolean {
  const isDuplicateAccount = messages.some((m) => /já existe uma conta cadastrada/i.test(m));
  return Boolean(isDuplicateAccount && updatedTerm && updatedTerm.versao === submittedVersion);
}

function LoginLink() {
  return (
    <p className="mt-6 text-center text-base font-semibold text-brand-300 animate-fade-up [animation-delay:420ms]">
      Já tem conta?{' '}
      <Link
        to={ROUTES.login}
        className="-my-3 inline-block py-3 text-brand-accent underline-offset-4 hover:underline"
      >
        Entrar
      </Link>
    </p>
  );
}

function useRegisterController(profileParam: string | null) {
  const navigate = useNavigate();
  const form = useForm(initialValues(profileParam), validateRegisterForm);
  const { run, isLoading, error } = useAsyncAction(authService.register);
  const termState = useCurrentTerm({ enabled: true, requireLiveTerm: true });
  const [conflictMessages, setConflictMessages] = useState<string[] | null>(null);

  function handleChange<K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
  ) {
    if (field === 'termosAceitos' && value === true) setConflictMessages(null);
    form.setValue(field, value);
  }

  async function handleSubmit() {
    if (!form.validateAll() || !termState.term || termState.isLoading) return;
    setConflictMessages(null);
    const submittedVersion = termState.term.versao;
    const result = await run(toRegisterPayload(form.values, submittedVersion));
    if (result.ok) {
      navigate(ROUTES.verifyAccount, {
        state: { usuarioId: result.data.usuarioId, email: result.data.usuario.email },
      });
      return;
    }
    if (result.error.status === 409) {
      const updatedTerm = await termState.reload();
      if (
        !isSameVersionDuplicateAccountConflict(result.error.messages, submittedVersion, updatedTerm)
      ) {
        form.setValue('termosAceitos', false);
        setConflictMessages([TERMS_UPDATED_CONFLICT_MESSAGE]);
      }
    }
  }

  return {
    form,
    isLoading,
    errorMessages: conflictMessages ?? error?.messages,
    termState,
    handleChange,
    handleSubmit,
  };
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const { form, isLoading, errorMessages, termState, handleChange, handleSubmit } =
    useRegisterController(searchParams.get('perfil'));

  return (
    <FlowShell
      title="Criar conta"
      subtitle={`Cadastro de ${profileLabel(form.values.tipo).toLowerCase()}`}
      backTo={ROUTES.profileSelection}
      backLabel="Voltar para a escolha de perfil"
    >
      <RegisterForm
        values={form.values}
        errors={form.errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        errorMessages={errorMessages}
        currentTerm={termState.term}
        isTermLoading={termState.isLoading}
        termError={termState.error}
        onRetryTerm={() => void termState.reload()}
      />
      <LoginLink />
    </FlowShell>
  );
}
