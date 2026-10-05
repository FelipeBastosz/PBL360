import { CalendarDaysIcon } from '@heroicons/react/24/outline';

type SessionsEmptyStateProps = {
  isProfessor: boolean;
};

export function SessionsEmptyState({ isProfessor }: SessionsEmptyStateProps) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-100 text-brand-900">
        <CalendarDaysIcon className="size-8" aria-hidden="true" />
      </div>

      <p className="mt-4 text-base font-semibold text-ink">
        {isProfessor
          ? 'Nenhuma sessão cadastrada neste problema.'
          : 'Nenhuma sessão disponível neste problema no momento.'}
      </p>

      <p className="mt-1 text-sm text-muted">
        {isProfessor ? (
          <>
            Toque no <span className="font-bold text-brand-900">+</span> para agendar a primeira
            sessão.
          </>
        ) : (
          'Aguarde o professor agendar as sessões.'
        )}
      </p>
    </div>
  );
}
