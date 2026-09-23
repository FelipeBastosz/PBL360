import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import type { FieldErrors } from '@/hooks/useForm';
import type { LoginFormValues } from '@/utils/authForms';

type LoginFormProps = {
  values: LoginFormValues;
  errors: FieldErrors<LoginFormValues>;
  onChange: (field: keyof LoginFormValues, value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessage?: string;
  registerTo: string;
};

export function LoginForm(props: LoginFormProps) {
  const { values, errors, onChange, isLoading, errorMessage } = props;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    props.onSubmit();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
      <TextField
        label="Email Institucional"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="seuemail@exemplo.com"
        value={values.email}
        onChange={(value) => onChange('email', value)}
        error={errors.email}
      />
      <PasswordField
        label="Senha"
        autoComplete="current-password"
        placeholder="Informe sua senha"
        value={values.senha}
        onChange={(value) => onChange('senha', value)}
        error={errors.senha}
      />
      <Button type="submit" isLoading={isLoading} className="mt-2 text-2xl">
        Entrar
      </Button>
      <div className="mt-6 flex flex-col items-center gap-1 text-sm">
        <p className="text-muted">
          Não tem conta?{' '}
          <Link to={props.registerTo} className="text-brand-900 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </form>
  );
}
