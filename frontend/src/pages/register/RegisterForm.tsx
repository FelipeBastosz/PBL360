import type { FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { PhotoField } from '@/components/ui/PhotoField';
import { TextField } from '@/components/ui/TextField';
import type { FieldErrors } from '@/hooks/useForm';
import type { UserTypePayload } from '@/types/auth';
import type { RegisterFormValues } from '@/utils/authForms';
import { ProfileToggle } from './ProfileToggle';

type RegisterFormProps = {
  values: RegisterFormValues;
  errors: FieldErrors<RegisterFormValues>;
  onChange: <K extends keyof RegisterFormValues>(field: K, value: RegisterFormValues[K]) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessages?: string[];
};

function StudentFields({ values, errors, onChange }: RegisterFormProps) {
  return (
    <>
      <TextField
        label="Matrícula"
        inputMode="numeric"
        maxLength={8}
        placeholder="00000000"
        value={values.matricula}
        onChange={(value) => onChange('matricula', value.replace(/\D/g, ''))}
        error={errors.matricula}
      />
      <PhotoField
        label="Foto"
        hint="JPEG, PNG ou WebP de até 2 MB. Usada para identificação nas sessões."
        value={values.foto}
        onChange={(file) => onChange('foto', file)}
        error={errors.foto}
      />
    </>
  );
}

function PasswordFields({ values, errors, onChange }: RegisterFormProps) {
  return (
    <>
      <PasswordField
        label="Senha"
        autoComplete="new-password"
        placeholder="Crie uma senha"
        hint="Mínimo de 8 caracteres."
        value={values.senha}
        onChange={(value) => onChange('senha', value)}
        error={errors.senha}
      />
      <PasswordField
        label="Confirmar Senha"
        autoComplete="new-password"
        placeholder="Repita a senha"
        value={values.confirmacao}
        onChange={(value) => onChange('confirmacao', value)}
        error={errors.confirmacao}
      />
    </>
  );
}

export function RegisterForm(props: RegisterFormProps) {
  const { values, errors, onChange, isLoading, errorMessages } = props;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    props.onSubmit();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {errorMessages?.length ? (
        <Alert tone="error">
          {errorMessages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </Alert>
      ) : null}
      <ProfileToggle
        value={values.tipo}
        onChange={(value: UserTypePayload) => onChange('tipo', value)}
      />
      <TextField
        label="Nome completo"
        autoComplete="name"
        placeholder="Seu nome"
        value={values.nome}
        onChange={(value) => onChange('nome', value)}
        error={errors.nome}
      />
      <TextField
        label="Email Institucional"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="seuemail@uefs.br"
        value={values.email}
        onChange={(value) => onChange('email', value)}
        error={errors.email}
      />
      {values.tipo === 'ALUNO' && <StudentFields {...props} />}
      <PasswordFields {...props} />
      <Button type="submit" isLoading={isLoading} className="mt-2">
        Criar conta
      </Button>
    </form>
  );
}
