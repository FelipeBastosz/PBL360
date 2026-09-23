import { cn } from '@/utils/cn';

type SectionLabelProps = {
  label: string;
  count?: number;
  className?: string;
};

export function SectionLabel({ label, count, className }: SectionLabelProps) {
  return (
    <p className={cn('text-sm font-bold tracking-widest text-brand-300 uppercase', className)}>
      {label}
      {count !== undefined && ` · ${count}`}
    </p>
  );
}
