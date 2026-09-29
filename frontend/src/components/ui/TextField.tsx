import { type ReactNode, useId } from 'react';
import { cn } from '@/utils/cn';
import { fieldControlClassName } from './fieldStyles';

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'url';
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'numeric' | 'url';
  maxLength?: number;
  error?: string;
  hint?: string;
  optional?: boolean;
  endAdornment?: ReactNode;
  autoFocus?: boolean;
  disabled?: boolean;
};

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  optional,
  endAdornment,
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-lg text-brand-900">
        {label}
        {optional && <span className="text-brand-300"> (opcional)</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(fieldControlClassName(Boolean(error)), endAdornment ? 'pr-12' : undefined)}
          {...inputProps}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-2 flex items-center">{endAdornment}</div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger animate-slide-down">
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-brand-300">
          {hint}
        </p>
      )}
    </div>
  );
}
