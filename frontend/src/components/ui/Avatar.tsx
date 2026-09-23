import { cn } from '@/utils/cn';

type AvatarSize = 'sm' | 'md' | 'lg';

type AvatarProps = {
  name: string;
  size?: AvatarSize;
  className?: string;
};

const SIZES: Record<AvatarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-base',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-brand-900 bg-brand-200',
        SIZES[size],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
