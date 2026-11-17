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
import type { RegisterFormValues } from '@/utils/authForms';

type RegisterFormProps = {
  values: RegisterFormValues;
  errors: FieldErrors<RegisterFormValues>;
  onChange: <K extends keyof RegisterFormValues>(field: K, value: RegisterFormValues[K]) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errorMessages?: string[];
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
};

function TermsCheckbox({ checked, onChange, error, onOpenTerms }: TermsCheckboxProps) {
  return (
    <div className="flex flex-col gap-1 text-left">
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
          .
        </span>
      </label>
      {error ? <p className="text-xs text-rose-600 pl-7">{error}</p> : null}
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
  const { values, errors, onChange, isLoading, errorMessages } = props;
  const [legalDoc, setLegalDoc] = useState<string | null>(null);

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
        />
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={!values.termosAceitos}
          className="mt-2"
        >
          Criar conta
        </Button>
      </form>
      <LegalDocumentModal
        isOpen={legalDoc !== null}
        title={legalDoc ?? ''}
        onClose={() => setLegalDoc(null)}
        maxWidth="max-w-2xl"
      >
        <TermsAndPrivacyContent />
      </LegalDocumentModal>
    </>
  );
}

export default RegisterForm;
