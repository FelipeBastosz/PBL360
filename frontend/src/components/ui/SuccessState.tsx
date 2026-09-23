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
      <div className="flex size-36 items-center justify-center rounded-full bg-brand-200">
        <CheckCircleIcon className="size-32 text-brand-900" strokeWidth={1.25} aria-hidden />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-[1.75rem] leading-tight font-semibold text-black">{title}</h2>
        {description && <p className="text-base text-muted">{description}</p>}
      </div>
      <div className="w-full">{action}</div>
    </div>
  );
}
