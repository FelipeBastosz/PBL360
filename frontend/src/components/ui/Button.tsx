import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'outline' | 'link';
type ButtonSize = 'default' | 'sm';

type ButtonProps = {
  children: ReactNode;
  type?: 'button' | 'submit';
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

const STYLES: Record<ButtonSize, Record<ButtonVariant, string>> = {
  default: {
    primary:
      'h-14 w-full rounded-xl border border-brand-primary-border px-4 text-lg font-semibold text-brand-on-primary bg-brand-primary shadow-[0_10px_24px_-8px_var(--color-brand-shadow)] transition-[background-color,box-shadow,scale] duration-200 ease-out hover:bg-brand-primary-hover hover:shadow-[0_14px_28px_-8px_var(--color-brand-shadow)] active:scale-[0.98] active:shadow-[0_6px_14px_-6px_var(--color-brand-shadow)] focus-visible:outline-brand-accent',
    outline:
      'h-12 w-full rounded-xl border border-brand-accent px-4 text-base font-semibold text-brand-accent bg-elevated transition-[background-color,scale] duration-200 hover:bg-brand-soft active:scale-[0.98] focus-visible:outline-brand-accent',
    link: 'relative text-sm font-medium after:absolute after:inset-x-0 after:-inset-y-2 text-brand-accent underline-offset-4 transition-colors hover:underline focus-visible:outline-brand-accent',
  },
  sm: {
    primary:
      'h-10 rounded-xl border border-brand-primary-border px-4 text-sm font-semibold text-brand-on-primary bg-brand-primary shadow-sm transition-[background-color,scale] duration-200 hover:bg-brand-primary-hover active:scale-[0.98] focus-visible:outline-brand-accent',
    outline:
      'h-10 rounded-xl border border-brand-accent px-4 text-sm font-semibold text-brand-accent bg-elevated transition-[background-color,scale] duration-200 hover:bg-brand-soft active:scale-[0.98] focus-visible:outline-brand-accent',
    link: 'relative text-xs font-medium after:absolute after:inset-x-0 after:-inset-y-1 text-brand-accent underline-offset-4 transition-colors hover:underline focus-visible:outline-brand-accent',
  },
};

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'default',
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
        STYLES[size][variant],
        className,
      )}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}
