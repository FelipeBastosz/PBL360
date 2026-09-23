import { LogoMark } from '@/components/ui/LogoMark';
import { Wordmark } from '@/components/ui/Wordmark';
import { cn } from '@/utils/cn';

type BrandHeroProps = {
  tagline?: string;
  discClassName?: string;
  markClassName?: string;
  className?: string;
};

export function BrandHero({ tagline, discClassName, markClassName, className }: BrandHeroProps) {
  return (
    <div className={cn('flex flex-col items-center text-center text-brand-900', className)}>
      <LogoMark className={markClassName ?? 'size-32'} discClassName={discClassName} />
      <Wordmark className="mt-2 h-7 w-auto" />
      {tagline && <p className="mt-2 max-w-[14rem] text-base text-muted">{tagline}</p>}
    </div>
  );
}
