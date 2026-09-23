import type { FormEvent } from 'react';
import { useForm } from '@/hooks/useForm';
import { validateCodeForm } from '@/utils/authForms';
import { Alert } from './Alert';
import { Button } from './Button';
import { ResendCodeButton } from './ResendCodeButton';
import { TextField } from './TextField';

type CodeFormProps = {
  hint: string;
  placeholder: string;
  onSubmit: (code: string) => void;
  isLoading: boolean;
  errorMessage?: string;
  onResend: () => Promise<boolean>;
  isResending: boolean;
};

export function CodeForm({
  hint,
  placeholder,
  onSubmit,
  isLoading,
  errorMessage,
  ...resend
}: CodeFormProps) {
  const form = useForm({ codigo: '' }, validateCodeForm);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.validateAll()) onSubmit(form.values.codigo.trim());
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {errorMessage && <Alert tone="error">{errorMessage}</Alert>}
      <TextField
        label="Código"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder={placeholder}
        hint={hint}
        value={form.values.codigo}
        onChange={(value) => form.setValue('codigo', value.replace(/\D/g, ''))}
        error={form.errors.codigo}
        autoFocus
      />
      <Button type="submit" isLoading={isLoading} className="mt-8">
        Confirmar
      </Button>
      <div className="flex justify-center">
        <ResendCodeButton onResend={resend.onResend} isLoading={resend.isResending} />
      </div>
    </form>
  );
}
