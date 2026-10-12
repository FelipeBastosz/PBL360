import { ArrowPathIcon, ArrowsRightLeftIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import type { PokerConnection } from '@/types/planningPoker';

type PokerStatusBarProps = {
  connection: PokerConnection;
  anonymous: boolean;
  roundLabel: string;
  onOpenProgress?: () => void;
};

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
      <span className="size-[7px] rounded-full bg-success shadow-[0_0_0_3px_rgb(6_118_71/0.18)]" />
      Ao vivo
    </span>
  );
}

function ReconnectingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-line bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning">
      <ArrowPathIcon className="size-3" strokeWidth={2.5} aria-hidden />
      Reconectando…
    </span>
  );
}

export function PokerStatusBar({
  connection,
  anonymous,
  roundLabel,
  onOpenProgress,
}: PokerStatusBarProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 px-4 pt-3 whitespace-nowrap lg:px-6 lg:pt-4">
      {connection === 'live' ? <LiveBadge /> : <ReconnectingBadge />}
      <span className="rounded-full border border-brand-200 bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-900">
        {anonymous ? 'Anônimo' : 'Com nomes'}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-muted">{roundLabel}</span>
      {onOpenProgress && (
        <button
          type="button"
          onClick={onOpenProgress}
          className="py-1 text-sm font-medium text-brand-900 underline underline-offset-4"
        >
          Progresso
        </button>
      )}
    </div>
  );
}

export function ShuffleNotice() {
  return (
    <div className="flex shrink-0 items-center gap-1.5 px-4 pt-2 text-xs text-muted lg:px-6">
      <ArrowsRightLeftIcon className="size-3.5 text-brand-900" strokeWidth={2} aria-hidden />
      Posições embaralhadas nesta rodada
    </div>
  );
}

export function ReconnectingNotice() {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-[10px] border border-warning-line bg-warning-soft p-3 text-sm text-warning"
    >
      <SignalSlashIcon className="mt-px size-5 shrink-0" aria-hidden />
      <div className="flex-1">
        <strong className="font-semibold">Conexão perdida.</strong> Tentando reconectar. Os votos já
        enviados estão salvos.
      </div>
    </div>
  );
}
