import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { fieldControlClassName } from './fieldStyles';

type SearchFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function SearchField({ label, value, onChange, className }: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <input
        type="text"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(fieldControlClassName(false), 'peer pl-11')}
      />
      <MagnifyingGlassIcon
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-placeholder transition-colors duration-200 peer-focus:text-brand-900"
        aria-hidden
      />
    </div>
  );
}
