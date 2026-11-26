import { KeyIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import type { ChangePasswordPayload } from '@/types/user';
import { useChangePassword } from '../hooks/useChangePassword';
import { ChangePasswordFields } from './ChangePasswordFields';

interface ChangePasswordFormProps {
  onSavePassword: (payload: ChangePasswordPayload) => Promise<boolean>;
}

export function ChangePasswordForm({ onSavePassword }: ChangePasswordFormProps) {
  const form = useChangePassword(onSavePassword);

  if (!form.isOpen) {
    return (
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => form.setIsOpen(true)}
          className="h-11 w-full justify-center gap-2 rounded-xl border-brand-accent px-4 text-sm font-semibold text-brand-accent sm:w-auto"
        >
          <KeyIcon className="size-4" aria-hidden />
          Alterar senha
        </Button>
      </div>
    );
  }

  return <ChangePasswordFields form={form} />;
}
