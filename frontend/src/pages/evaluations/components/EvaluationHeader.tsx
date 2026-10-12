import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/hooks/useAuth';

export function EvaluationHeader({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack ?? (() => navigate(-1))}
          aria-label="Voltar"
          className="rounded-md p-1 hover:bg-white/10"
        >
          <ChevronLeftIcon className="size-6" strokeWidth={2} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-base font-bold leading-tight">Avaliação</h1>
          <span className="text-xs text-white/70">Aluno</span>
        </div>
      </div>
      <UserAvatar user={user} />
    </header>
  );
}
