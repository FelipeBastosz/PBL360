import { useState, type FormEvent } from 'react';
import { TermsAndPrivacyContent } from '@/components/layout/TermsAndPrivacyContent';
import { Alert } from '@/components/ui/Alert';
import { AvatarPicker } from '@/components/ui/AvatarPicker';
import { Button } from '@/components/ui/Button';
import { LegalDocumentModal } from '@/components/ui/LegalDocumentModal';
import { PasswordField } from '@/components/ui/PasswordField';
import { TextField } from '@/components/ui/TextField';
import { LEGAL_TERMS_AND_PRIVACY_TITLE } from '@/content/legal';
import type { FieldErrors } from '@/hooks/useForm';
import type { CurrentCommitmentTerm } from '@/services/commitmentTerms.service';
import type { RegisterFormValues } from '@/utils/authForms';

type RegisterFormProps = {
  values: RegisterFormValues;
  errors: FieldErrors<RegisterFormValues>;
  onChange: <K extends keyof RegisterFormValues>(field: K, value: RegisterFormValues[K]) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessages?: string[];
  currentTerm?: CurrentCommitmentTerm | null;
  isTermLoading?: boolean;
  termError?: string | null;
  onRetryTerm?: () => void;
};

function IdentityFields({ values, errors, onChange }: RegisterFormProps) {
  const isStudent = values.tipo === 'ALUNO';

  return (
    <>
      <TextField
        label="Nome completo"
        autoComplete="name"
        placeholder="Seu nome completo"
        value={values.nome}
        onChange={(value) => onChange('nome', value)}
        error={errors.nome}
      />
      <TextField
        label="Email Institucional"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder={isStudent ? 'matricula@discente.uefs.br' : 'seunome@uefs.br'}
        value={values.email}
        onChange={(value) => onChange('email', value)}
        error={errors.email}
      />
      <TextField
        label="Matrícula"
        optional={!isStudent}
        inputMode="numeric"
        maxLength={8}
        placeholder="Número de matrícula"
        value={values.matricula}
        onChange={(value) => onChange('matricula', value.replace(/\D/g, ''))}
        error={errors.matricula}
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
        label="Confirmar a Senha"
        autoComplete="new-password"
        placeholder="Repita a senha"
        value={values.confirmacao}
        onChange={(value) => onChange('confirmacao', value)}
        error={errors.confirmacao}
      />
    </>
  );
}

type TermsCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  onOpenTerms: () => void;
  currentVersion?: string;
  termError?: string | null;
  onRetryTerm?: () => void;
};

function TermsNotice({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-900 text-left animate-shake">
      <span className="font-semibold">Aviso:</span>{' '}
      {message ??
        'O cadastro só pode ser realizado se você marcar que leu e concorda com os Termos de Uso e Política de Privacidade.'}
    </div>
  );
}

function TermLoadAlert({ message, onRetry }: { message?: string | null; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <Alert tone="error" className="text-xs">
      <p>{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-2">
          Tentar novamente
        </Button>
      ) : null}
    </Alert>
  );
}

function TermsCheckbox({
  checked,
  onChange,
  error,
  onOpenTerms,
  currentVersion,
  termError,
  onRetryTerm,
}: TermsCheckboxProps) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <TermLoadAlert message={termError} onRetry={onRetryTerm} />
      {error ? <TermsNotice message={error} /> : null}
      <label className="flex items-start gap-3 cursor-pointer select-none text-xs text-muted">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 rounded border-black/20 text-brand-900 focus:ring-brand-900 cursor-pointer"
        />
        <span>
          Eu li e concordo com os{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenTerms();
            }}
            className="font-semibold text-brand-900 underline underline-offset-2 hover:text-brand-700"
          >
            Termos de Uso e Política de Privacidade
          </button>
          {currentVersion ? ` (v${currentVersion})` : ''}.
        </span>
      </label>
    </div>
  );
}

function FormErrorAlert({ errorMessages }: { errorMessages?: string[] }) {
  if (!errorMessages?.length) return null;
  return (
    <div className="animate-shake">
      <Alert tone="error">
        {errorMessages.map((message) => (
          <p key={message}>{message}</p>
        ))}
      </Alert>
    </div>
  );
}

export function RegisterForm(props: RegisterFormProps) {
  const {
    values,
    errors,
    onChange,
    isLoading,
    errorMessages,
    currentTerm,
    isTermLoading,
    termError,
    onRetryTerm,
  } = props;
  const [legalDoc, setLegalDoc] = useState<string | null>(null);
  const submitDisabled = Boolean(isTermLoading) || !currentTerm || Boolean(termError);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    props.onSubmit();
  }

  return (
    <>
      <form noValidate onSubmit={handleSubmit} className="stagger-in flex flex-col gap-5">
        <AvatarPicker
          value={values.foto}
          onChange={(file) => onChange('foto', file)}
          error={errors.foto}
          optional={values.tipo !== 'ALUNO'}
        />
        <FormErrorAlert errorMessages={errorMessages} />
        <IdentityFields {...props} />
        <PasswordFields {...props} />
        <TermsCheckbox
          checked={values.termosAceitos}
          onChange={(checked) => onChange('termosAceitos', checked)}
          error={errors.termosAceitos}
          onOpenTerms={() => setLegalDoc(LEGAL_TERMS_AND_PRIVACY_TITLE)}
          termError={termError}
          onRetryTerm={onRetryTerm}
        />
        <Button type="submit" isLoading={isLoading} disabled={submitDisabled} className="mt-2">
          Criar conta
        </Button>
      </form>
      <LegalDocumentModal
        isOpen={legalDoc !== null}
        title={legalDoc ?? ''}
        onClose={() => setLegalDoc(null)}
        maxWidth="max-w-2xl"
      >
        <TermsAndPrivacyContent
          term={currentTerm ?? null}
          isLoading={isTermLoading}
          error={termError}
          onRetry={onRetryTerm}
          requireLiveTerm
        />
      </LegalDocumentModal>
    </>
  );
}

export default RegisterForm;
