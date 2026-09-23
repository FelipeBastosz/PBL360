import { type ReactNode, useId } from 'react';
import { cn } from '@/utils/cn';

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
  endAdornment?: ReactNode;
  autoFocus?: boolean;
};

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  error,
  hint,
  endAdornment,
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-lg text-brand-900">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            'h-12 w-full rounded-[10px] border px-4 text-base text-ink bg-white placeholder:text-placeholder focus:outline-2 focus:outline-offset-0 focus:outline-brand-900',
            endAdornment ? 'pr-12' : undefined,
            error ? 'border-danger' : 'border-black/20',
          )}
          {...inputProps}
        />
        {endAdornment && (
          <div className="absolute inset-y-0 right-2 flex items-center">{endAdornment}</div>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
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
