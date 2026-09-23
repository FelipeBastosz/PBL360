import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { BrandHeader } from './BrandHeader';

type AppHeaderBaseProps = {
  userName: string;
  onAvatarClick?: () => void;
};

type AppHeaderProps =
  | ({ variant?: 'brand' } & AppHeaderBaseProps)
  | ({ variant: 'back'; title: string; backTo: string; backLabel?: string } & AppHeaderBaseProps);

export function AppHeader(props: AppHeaderProps) {
  return (
    <header className="flex h-20 shrink-0 items-center justify-between px-6 text-white bg-brand-900 lg:px-10">
      {props.variant === 'back' ? (
        <div className="flex items-center gap-4">
          <Link
            to={props.backTo}
            aria-label={props.backLabel ?? 'Voltar'}
            className="-ml-2 rounded-md p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeftIcon className="size-7" aria-hidden />
          </Link>
          <h1 className="text-2xl font-semibold">{props.title}</h1>
        </div>
      ) : (
        <BrandHeader className="text-white" />
      )}
      <button
        type="button"
        onClick={props.onAvatarClick}
        aria-label="Minha conta"
        className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <Avatar name={props.userName} />
      </button>
    </header>
  );
}
