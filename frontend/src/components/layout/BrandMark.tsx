import { LogoMark } from '@/components/ui/LogoMark';

type BrandMarkProps = {
  size?: 'sm' | 'lg';
  showTagline?: boolean;
};

export function BrandMark({ size = 'lg', showTagline = false }: BrandMarkProps) {
  const iconSize = size === 'lg' ? 'w-28 h-28' : 'w-8 h-8';

  return (
    <div className="flex flex-col items-center gap-3">
      <LogoMark className={`${iconSize} text-brand-500`} />
      <div className="text-center">
        <p
          className={
            size === 'lg'
              ? 'text-3xl font-bold text-brand-500'
              : 'text-base font-bold text-brand-500'
          }
        >
          PBL360
        </p>
        {showTagline && (
          <p className="mt-1 text-sm text-gray-400">Acompanhamento de desempenho em PBL</p>
        )}
      </div>
    </div>
  );
}
