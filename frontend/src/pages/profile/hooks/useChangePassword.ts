import { useState } from 'react';
import {
  validateNewPassword,
  validatePasswordConfirmation,
  validateRequiredPassword,
} from '@/utils/validation';
import type { ChangePasswordPayload } from '@/types/user';

export function useChangePassword(
  onSavePassword: (payload: ChangePasswordPayload) => Promise<boolean>,
) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setIsOpen(false);
  }

  async function submit() {
    const currentErr = validateRequiredPassword(currentPassword);
    const nextErr = validateNewPassword(newPassword);
    const confirmErr = validatePasswordConfirmation(newPassword, confirmPassword);

    if (currentErr || nextErr || confirmErr) {
      setErrors({ current: currentErr, next: nextErr, confirm: confirmErr });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    const ok = await onSavePassword({ senhaAtual: currentPassword, novaSenha: newPassword });
    setIsSubmitting(false);

    if (ok) resetForm();
  }

  return {
    isOpen,
    setIsOpen,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    errors,
    setErrors,
    isSubmitting,
    resetForm,
    submit,
  };
}
