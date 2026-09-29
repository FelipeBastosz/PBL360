import { cn } from '@/utils/cn';

export function fieldControlClassName(hasError: boolean): string {
  return cn(
    'h-12 w-full rounded-xl border px-4 text-base text-ink bg-white shadow-[0_1px_2px_rgb(16_33_76/0.06)] transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-placeholder hover:border-brand-300 focus:border-brand-900 focus:shadow-[0_0_0_4px_rgb(0_0_119/0.12)] focus:outline-none disabled:cursor-not-allowed disabled:bg-black/5 disabled:text-placeholder disabled:hover:border-black/10',
    hasError
      ? 'border-danger hover:border-danger focus:border-danger focus:shadow-[0_0_0_4px_rgb(180_35_24/0.12)]'
      : 'border-black/10',
  );
}
