import { useId } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { fieldControlClassName } from './fieldStyles';

type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
};

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  error,
  disabled,
}: SelectFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-lg text-brand-900">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            fieldControlClassName(Boolean(error)),
            'peer appearance-none pr-11',
            value === '' && 'text-placeholder',
          )}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-placeholder transition-transform duration-200 peer-focus:rotate-180 peer-focus:text-brand-900">
          <ChevronDownIcon className="size-5" aria-hidden />
        </div>
      </div>
      {error && <p className="text-sm text-danger animate-slide-down">{error}</p>}
    </div>
  );
}
