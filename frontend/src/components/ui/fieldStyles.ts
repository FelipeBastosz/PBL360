import { cn } from '@/utils/cn';

export function fieldControlClassName(hasError: boolean): string {
  return cn(
    'h-12 w-full rounded-xl border px-4 text-base text-ink bg-elevated shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-placeholder hover:border-brand-300 focus:border-brand-accent focus:shadow-[0_0_0_4px_var(--color-brand-ring)] focus:outline-none disabled:cursor-not-allowed disabled:bg-subtle disabled:text-placeholder disabled:hover:border-border',
    hasError
      ? 'border-danger hover:border-danger focus:border-danger focus:shadow-[0_0_0_4px_rgb(180_35_24/0.16)]'
      : 'border-border',
  );
}
