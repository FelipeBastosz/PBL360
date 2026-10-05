import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';

type BackHeaderProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
};

export function BackHeader({ title, subtitle, onBack }: BackHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-brand-900 text-white shadow-[0_6px_18px_-12px_rgb(0_0_119/0.8)]">
      <div className="mx-auto flex h-20 w-full max-w-5xl items-center gap-3 px-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="-ml-1 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronLeftIcon className="size-6" aria-hidden />
        </button>
        <div className="flex min-w-0 flex-1 flex-col animate-slide-down">
          <h1 className="truncate text-xl leading-tight font-semibold">{title}</h1>
          <p className="truncate text-sm text-white/70">{subtitle}</p>
        </div>
        <UserAvatar user={user} className="animate-pop-in ring-2 ring-white/20" />
      </div>
    </header>
  );
}
