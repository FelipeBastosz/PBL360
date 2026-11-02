import { UserMinusIcon } from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';

type NonParticipantEmptyStateProps = {
  className?: string;
};

export function NonParticipantEmptyState({ className }: NonParticipantEmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-black/5 bg-white p-6 sm:p-8 text-center shadow-sm',
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-surface text-muted">
        <UserMinusIcon className="size-8 text-muted" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-bold text-ink sm:text-lg">
        Você não participou desta sessão
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted leading-relaxed">
        Você não participou desta sessão, portanto não possui avaliações disponíveis.
      </p>
    </div>
  );
}
