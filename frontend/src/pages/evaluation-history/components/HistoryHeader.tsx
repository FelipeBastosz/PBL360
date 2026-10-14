import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';

type HistoryHeaderProps = {
  onBack: () => void;
};

export function HistoryHeader({ onBack }: HistoryHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-brand-900 text-white">
      <div className="mx-auto flex h-[84px] w-full max-w-[720px] items-center pt-1 pr-[25px] pl-[23px]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="-m-2 rounded-full p-2 transition-[background-color,scale] duration-200 hover:bg-white/10 active:scale-90 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ChevronLeftIcon className="size-6" strokeWidth={2.3} aria-hidden />
        </button>
        <h1 className="ml-4 min-w-0 -translate-y-px flex-1 truncate text-[18px] leading-[22px] font-semibold">
          Histórico de avaliações
        </h1>
        <UserAvatar user={user} className="text-[14px]! text-[#000049]!" />
      </div>
    </header>
  );
}
