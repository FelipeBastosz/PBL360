import type { FormEvent } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/ui/PasswordField';
import type { FieldErrors } from '@/hooks/useForm';
import type { NewPasswordFormValues } from '@/utils/authForms';

type ResetPasswordFormProps = {
  values: NewPasswordFormValues;
  errors: FieldErrors<NewPasswordFormValues>;
  onChange: (field: keyof NewPasswordFormValues, value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessage?: string;
};

export function ResetPasswordForm(props: ResetPasswordFormProps) {
  const { values, errors, onChange, onSubmit, isLoading, errorMessage } = props;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
      <PasswordField
        label="Nova Senha"
        autoComplete="new-password"
        placeholder="Informe sua nova senha"
        value={values.senha}
        onChange={(value) => onChange('senha', value)}
        error={errors.senha}
      />
      <PasswordField
        label="Confirmar Senha"
        autoComplete="new-password"
        placeholder="Repita sua nova senha"
        value={values.confirmacao}
        onChange={(value) => onChange('confirmacao', value)}
        error={errors.confirmacao}
      />
      <Button type="submit" isLoading={isLoading} className="mt-8">
        Redefinir senha
      </Button>
    </form>
  );
}
