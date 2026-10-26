import { LockClosedIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { SessionReleasesResponse, EvaluationReleaseInfo } from '@/types/session';

type CardProps = {
  releases: SessionReleasesResponse | null;
  onToggle: (type: 'autoavaliacao' | 'pares') => void;
  isAttendancePending: boolean;
  isLoading: boolean;
};

function formatDeadline(isoDate: string | null) {
  if (!isoDate) return 'Sem prazo limite';
  const date = new Date(isoDate);
  return `Até ${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

type ToggleRowProps = {
  label: string;
  info: EvaluationReleaseInfo | undefined;
  isDisabled: boolean;
  onToggle: () => void;
};

function EvaluationToggleRow({ label, info, isDisabled, onToggle }: ToggleRowProps) {
  const isLiberada = Boolean(info?.liberada);

  return (
    <div className="flex flex-col gap-1.5 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
          {isDisabled && <LockClosedIcon className="size-4 shrink-0 text-muted" />}
          <span>{label}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isLiberada}
          aria-label={label}
          disabled={isDisabled}
          onClick={onToggle}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            isDisabled
              ? 'cursor-not-allowed opacity-40 bg-black/20'
              : isLiberada
                ? 'bg-success cursor-pointer'
                : 'bg-black/20 cursor-pointer'
          }`}
        >
          <span
            className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${isLiberada ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      {isLiberada && info && (
        <div className="flex flex-wrap items-center justify-between gap-1 text-xs text-muted pl-6">
          <span className="font-semibold text-brand-900">
            {info.enviadas} de {info.esperadas} enviaram
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <CalendarIcon className="size-3.5" />
            {formatDeadline(info.prazo)}
          </span>
        </div>
      )}
    </div>
  );
}

export function SessionEvaluationsCard({
  releases,
  onToggle,
  isAttendancePending,
  isLoading,
}: CardProps) {
  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-base font-bold text-brand-900">Autoavaliação e pares</h3>
        <p className="mt-0.5 text-xs text-muted">
          Liberar formulários de avaliação dos alunos para esta sessão.
        </p>
      </div>

      {isAttendancePending && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
          <ExclamationTriangleIcon className="size-4 shrink-0 mt-0.5 text-amber-600" />
          <span>
            Salve a chamada da sessão primeiro para definir os alunos participantes e liberar as
            avaliações.
          </span>
        </div>
      )}

      <div className="mt-1 flex flex-col divide-y divide-black/5 border-t border-black/5 pt-1">
        <EvaluationToggleRow
          label="Autoavaliação dos alunos"
          info={releases?.autoavaliacao}
          isDisabled={isAttendancePending || isLoading}
          onToggle={() => onToggle('autoavaliacao')}
        />
        <EvaluationToggleRow
          label="Avaliação entre pares"
          info={releases?.pares}
          isDisabled={isAttendancePending || isLoading}
          onToggle={() => onToggle('pares')}
        />
      </div>
    </div>
  );
}
