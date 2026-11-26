import { LockClosedIcon } from '@heroicons/react/24/outline';
import { CardsIcon } from '../planning-poker/CardsIcon';
import { LiveBadge } from '../planning-poker/PokerStatusBar';
import { StartPokerModal } from './StartPokerModal';
import { usePlanningPokerEntry } from './usePlanningPokerEntry';

type PlanningPokerHubCardProps = {
  sessionId: string;
  pokerPath: string;
  refreshKey?: unknown;
  entry?: ReturnType<typeof usePlanningPokerEntry>;
};

function DisabledPokerCard({ reason }: { reason: string }) {
  return (
    <div
      aria-disabled="true"
      className="flex cursor-not-allowed flex-col gap-3 rounded-2xl border border-dashed border-border bg-elevated/70 p-4"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-subtle text-muted">
        <CardsIcon className="size-[26px]" backFill="var(--color-subtle)" />
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
  entry: passedEntry,
}: PlanningPokerHubCardProps) {
  const hookEntry = usePlanningPokerEntry(passedEntry ? '' : sessionId, pokerPath, refreshKey);
  const entry = passedEntry ?? hookEntry;
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
        className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-elevated p-4 text-left text-ink shadow-sm transition hover:shadow-md"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-accent">
          <CardsIcon className="size-[26px]" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold break-words text-ink">Planning poker</h3>
            {availability.pokerAbertoId ? (
              <LiveBadge />
            ) : (
              <span className="rounded-full border border-brand-border bg-brand-soft px-2 text-[11px] leading-[18px] font-semibold text-brand-accent">
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
