import type { ComponentType, SVGProps } from 'react';
import { Link } from 'react-router-dom';

type ProfileOptionProps = {
  to: string;
  title: string;
  description: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function ProfileOption({ to, title, description, Icon }: ProfileOptionProps) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-5 rounded-[10px] border border-border px-6 py-5 text-brand-accent bg-elevated transition-colors hover:border-brand-accent hover:text-white hover:bg-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-border group-hover:bg-white/20">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-lg font-semibold">{title}</span>
        <span className="text-sm font-medium">{description}</span>
      </span>
    </Link>
  );
}
