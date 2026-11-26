import { PasswordInputs } from './PasswordInputs';
import { FormActions } from './FormActions';
import type { useChangePassword } from '../hooks/useChangePassword';

type ChangePasswordFieldsProps = {
  form: ReturnType<typeof useChangePassword>;
};

export function ChangePasswordFields({ form }: ChangePasswordFieldsProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.submit();
      }}
      noValidate
      className="mt-3 flex flex-col gap-4 rounded-xl border border-border bg-elevated p-4 animate-fade-up sm:p-5"
    >
      <div className="border-b border-border pb-2">
        <h3 className="text-base font-semibold text-brand-accent">Alterar Senha</h3>
        <p className="text-xs text-brand-300">Informe sua senha atual e escolha uma nova senha.</p>
      </div>

      <PasswordInputs
        current={form.currentPassword}
        next={form.newPassword}
        confirm={form.confirmPassword}
        errors={form.errors}
        onCurrentChange={(val) => {
          form.setCurrentPassword(val);
          if (form.errors.current) form.setErrors((p) => ({ ...p, current: undefined }));
        }}
        onNextChange={(val) => {
          form.setNewPassword(val);
          if (form.errors.next) form.setErrors((p) => ({ ...p, next: undefined }));
        }}
        onConfirmChange={(val) => {
          form.setConfirmPassword(val);
          if (form.errors.confirm) form.setErrors((p) => ({ ...p, confirm: undefined }));
        }}
      />

      <FormActions isSubmitting={form.isSubmitting} onCancel={form.resetForm} />
    </form>
  );
}
