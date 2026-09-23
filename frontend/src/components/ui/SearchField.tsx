import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useId } from 'react';
import { cn } from '@/utils/cn';

type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder = 'Pesquisar',
  label = 'Pesquisar',
  className,
}: SearchFieldProps) {
  const id = useId();

  return (
    <div className={cn('relative', className)}>
      <MagnifyingGlassIcon
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-placeholder"
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-14 w-full rounded-full border border-black/10 bg-white pr-4 pl-12 text-base text-ink placeholder:text-placeholder focus:outline-2 focus:outline-offset-0 focus:outline-brand-900"
      />
    </div>
  );
}
