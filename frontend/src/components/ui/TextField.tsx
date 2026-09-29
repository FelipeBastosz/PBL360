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
  optional?: boolean;
  endAdornment?: ReactNode;
  autoFocus?: boolean;
  disabled?: boolean;
};

function inputClassName(hasAdornment: boolean, hasError: boolean): string {
  return cn(
    'h-12 w-full rounded-xl border px-4 text-base text-ink bg-white shadow-[0_1px_2px_rgb(16_33_76/0.06)] transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-placeholder hover:border-brand-300 focus:border-brand-900 focus:shadow-[0_0_0_4px_rgb(0_0_119/0.12)] focus:outline-none',
    hasAdornment ? 'pr-12' : undefined,
    hasError
      ? 'border-danger hover:border-danger focus:border-danger focus:shadow-[0_0_0_4px_rgb(180_35_24/0.12)]'
      : 'border-black/10',
  );
}

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
          className={inputClassName(Boolean(endAdornment), Boolean(error))}
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
