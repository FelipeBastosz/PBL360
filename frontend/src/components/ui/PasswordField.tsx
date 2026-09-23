import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { TextField } from './TextField';

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: 'current-password' | 'new-password';
  error?: string;
  hint?: string;
};

export function PasswordField(props: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? EyeIcon : EyeSlashIcon;

  return (
    <TextField
      {...props}
      type={isVisible ? 'text' : 'password'}
      endAdornment={
        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={isVisible}
          className="rounded-md p-2 text-placeholder hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-brand-900"
        >
          <Icon className="size-6" aria-hidden />
        </button>
      }
    />
  );
}
