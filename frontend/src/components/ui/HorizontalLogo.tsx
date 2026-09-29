import {
  LOGO_VIEW_BOX,
  LOGO_DISC_PATH,
  LOGO_FIGURE_PATHS,
  WORDMARK_VIEW_BOX,
  WORDMARK_PATH,
} from '@/assets/logoPaths';
import { cn } from '@/utils/cn';

type BrandLogoHorizontalProps = {
  className?: string;
};

export function HorizontalLogo({ className }: BrandLogoHorizontalProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg viewBox={LOGO_VIEW_BOX} className="size-9 shrink-0" aria-hidden="true">
        {/* Círculo de fundo branco */}
        <path d={LOGO_DISC_PATH} className="fill-white" />

        {LOGO_FIGURE_PATHS.map((path, index) => (
          <path
            key={index}
            d={path}
            fillRule="evenodd"
            clipRule="evenodd"
            className="fill-brand-900"
          />
        ))}
      </svg>

      <svg
        viewBox={WORDMARK_VIEW_BOX}
        className="h-5 w-auto fill-white shrink-0"
        role="img"
        aria-label="PBL360"
      >
        <path d={WORDMARK_PATH} />
      </svg>
    </div>
  );
}
