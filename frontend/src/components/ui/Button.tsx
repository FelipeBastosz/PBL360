import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'outline' | 'link';

type ButtonProps = {
  children: ReactNode;
  type?: 'button' | 'submit';
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'h-14 w-full rounded-xl px-4 text-lg font-semibold text-white bg-brand-900 shadow-[0_10px_24px_-8px_rgb(0_0_119/0.55)] transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-brand-700 hover:shadow-[0_14px_28px_-8px_rgb(0_0_119/0.6)] active:scale-[0.98] active:shadow-[0_6px_14px_-6px_rgb(0_0_119/0.5)] focus-visible:outline-brand-900',
  outline:
    'h-12 w-full rounded-xl border border-brand-900 px-4 text-base font-semibold text-brand-900 bg-white transition-[background-color,transform] duration-200 hover:bg-brand-50 active:scale-[0.98] focus-visible:outline-brand-900',
  link: 'text-sm font-medium text-brand-900 underline-offset-4 transition-colors hover:underline focus-visible:outline-brand-900',
};

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  onClick,
  className,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={isLoading ? undefined : onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
        className,
      )}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}
