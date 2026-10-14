import { ChevronRightIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { CardsIcon } from '../planning-poker/CardsIcon';
import { LiveBadge } from '../planning-poker/PokerStatusBar';
import { StartPokerModal } from './StartPokerModal';
import { usePlanningPokerEntry } from './usePlanningPokerEntry';

type PlanningPokerHubCardProps = {
  sessionId: string;
  pokerPath: string;
  refreshKey?: unknown;
};

function DisabledPokerCard({ reason }: { reason: string }) {
  return (
    <div
      aria-disabled="true"
      className="col-span-2 flex cursor-not-allowed items-center gap-3 rounded-2xl border border-dashed border-black/15 bg-white/70 p-4"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <CardsIcon className="size-[26px]" backFill="#f3f4f6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-bold text-muted">Planning poker</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-warning">
          <LockClosedIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          {reason}
        </span>
      </span>
    </div>
  );
}

export function PlanningPokerHubCard({
  sessionId,
  pokerPath,
  refreshKey,
}: PlanningPokerHubCardProps) {
  const entry = usePlanningPokerEntry(sessionId, pokerPath, refreshKey);
  const availability = entry.availability;
  if (!availability) return null;
  if (!availability.disponivel && !availability.pokerAbertoId) {
    return <DisabledPokerCard reason={availability.motivo ?? 'Indisponível nesta sessão.'} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={entry.open}
        className="col-span-2 flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 text-left text-ink shadow-sm transition hover:shadow-md"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
          <CardsIcon className="size-[26px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="text-sm font-bold">Planning poker</span>
            {availability.pokerAbertoId ? (
              <LiveBadge />
            ) : (
              <span className="rounded-full border border-brand-200 bg-brand-100 px-2 text-[11px] leading-[18px] font-semibold text-brand-900">
                Novo
              </span>
            )}
          </span>
          <span className="text-xs leading-normal text-muted">Avaliação coletiva na mesa</span>
        </span>
        <ChevronRightIcon className="size-5 shrink-0 text-muted/60" aria-hidden />
      </button>
      {entry.isStarting && (
        <StartPokerModal
          presentStudents={availability.presentes}
          isLoading={entry.isLoading}
          onStart={entry.confirmStart}
          onClose={entry.cancelStart}
        />
      )}
    </>
  );
}
