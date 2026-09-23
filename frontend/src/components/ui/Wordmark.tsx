import { WORDMARK_PATH, WORDMARK_VIEW_BOX } from '@/assets/logoPaths';
import { cn } from '@/utils/cn';

type WordmarkProps = {
  className?: string;
  decorative?: boolean;
};

export function Wordmark({ className, decorative = false }: WordmarkProps) {
  return (
    <svg
      viewBox={WORDMARK_VIEW_BOX}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'PBL360'}
      aria-hidden={decorative || undefined}
      className={cn('shrink-0', className)}
      fill="currentColor"
    >
      <path d={WORDMARK_PATH} />
    </svg>
  );
}
