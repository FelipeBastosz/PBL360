import { LogoMark } from '@/components/ui/LogoMark';
import { Wordmark } from '@/components/ui/Wordmark';

export function BrandHeader() {
  return (
    <div className="flex items-center gap-2 text-brand-accent">
      <LogoMark className="size-11" />
      <Wordmark className="h-5 w-auto" />
    </div>
  );
}
