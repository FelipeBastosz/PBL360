import type { ReactNode } from 'react';
import { BrandHeader } from './BrandHeader';

type AuthCardProps = {
  children: ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="flex flex-1 flex-col p-5 bg-brand-900 lg:flex-none lg:p-0 lg:bg-transparent">
      <div className="flex flex-1 flex-col rounded-[20px] px-4 pt-5 pb-10 bg-card sm:px-8 lg:border lg:border-black/5 lg:px-10 lg:py-10 lg:shadow-xl">
        <BrandHeader />
        <div className="mx-auto mt-10 flex w-full max-w-sm flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
