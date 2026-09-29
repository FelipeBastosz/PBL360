import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';

type SuccessStateProps = {
  title: string;
  description?: string;
  action: ReactNode;
};

export function SuccessState({ title, description, action }: SuccessStateProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative size-36 animate-pop-in">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-brand-900/40 animate-ring [animation-delay:200ms]"
        />
        <div className="relative flex size-full items-center justify-center rounded-full bg-brand-200">
          <CheckCircleIcon className="size-32 text-brand-900" strokeWidth={1.25} aria-hidden />
        </div>
      </div>
      <div className="flex flex-col gap-2 animate-fade-up [animation-delay:180ms]">
        <h2 className="text-[1.75rem] leading-tight font-semibold text-black">{title}</h2>
        {description && <p className="text-base text-muted">{description}</p>}
      </div>
      <div className="w-full animate-fade-up [animation-delay:320ms]">{action}</div>
    </div>
  );
}
