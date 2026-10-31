import { LockClosedIcon } from '@heroicons/react/24/outline';
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
      className="flex cursor-not-allowed flex-col gap-3 rounded-2xl border border-dashed border-black/15 bg-white/70 p-4"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <CardsIcon className="size-[26px]" backFill="#f3f4f6" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-bold break-words text-muted">Planning poker</h3>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-warning">
          <LockClosedIcon className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
          {reason}
        </p>
      </div>
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
        className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 text-left text-ink shadow-sm transition hover:shadow-md"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
          <CardsIcon className="size-[26px]" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold break-words text-ink">Planning poker</h3>
            {availability.pokerAbertoId ? (
              <LiveBadge />
            ) : (
              <span className="rounded-full border border-brand-200 bg-brand-100 px-2 text-[11px] leading-[18px] font-semibold text-brand-900">
                Novo
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted leading-relaxed">Avaliação coletiva na mesa</p>
        </div>
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
