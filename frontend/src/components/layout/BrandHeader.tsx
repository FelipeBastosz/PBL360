import { LogoMark } from '@/components/ui/LogoMark';
import { Wordmark } from '@/components/ui/Wordmark';
import { cn } from '@/utils/cn';

type BrandHeaderProps = {
  className?: string;
};

export function BrandHeader({ className }: BrandHeaderProps = {}) {
  return (
    <div className={cn('flex items-center gap-2 text-brand-900', className)}>
      <LogoMark className="size-11" />
      <Wordmark className="h-5 w-auto" />
    </div>
  );
}
