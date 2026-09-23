import { LOGO_DISC_PATH, LOGO_FIGURE_PATHS, LOGO_VIEW_BOX } from '@/assets/logoPaths';
import { cn } from '@/utils/cn';

type LogoMarkProps = {
  className?: string;
  discClassName?: string;
  title?: string;
};

export function LogoMark({ className, discClassName, title }: LogoMarkProps) {
  return (
    <svg
      viewBox={LOGO_VIEW_BOX}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn('shrink-0', className)}
      fill="currentColor"
    >
      {discClassName && <path d={LOGO_DISC_PATH} className={discClassName} />}
      {LOGO_FIGURE_PATHS.map((path) => (
        <path key={path.slice(0, 24)} d={path} fillRule="evenodd" clipRule="evenodd" />
      ))}
    </svg>
  );
}
