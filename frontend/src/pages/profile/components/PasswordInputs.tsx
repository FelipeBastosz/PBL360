import { PasswordField } from '@/components/ui/PasswordField';

type PasswordInputsProps = {
  current: string;
  next: string;
  confirm: string;
  errors: { current?: string; next?: string; confirm?: string };
  onCurrentChange: (val: string) => void;
  onNextChange: (val: string) => void;
  onConfirmChange: (val: string) => void;
};

export function PasswordInputs({
  current,
  next,
  confirm,
  errors,
  onCurrentChange,
  onNextChange,
  onConfirmChange,
}: PasswordInputsProps) {
  return (
    <>
      <PasswordField
        label="Senha atual"
        placeholder="Digite sua senha atual"
        value={current}
        onChange={onCurrentChange}
        error={errors.current}
        autoComplete="current-password"
      />
      <PasswordField
        label="Nova senha"
        placeholder="Digite sua nova senha"
        hint="Mínimo de 8 caracteres."
        value={next}
        onChange={onNextChange}
        error={errors.next}
        autoComplete="new-password"
      />
      <PasswordField
        label="Confirmar nova senha"
        placeholder="Repita a nova senha"
        value={confirm}
        onChange={onConfirmChange}
        error={errors.confirm}
        autoComplete="new-password"
      />
    </>
  );
}
