import { LockClosedIcon, CalendarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { SessionReleasesResponse, EvaluationReleaseInfo } from '@/types/session';
import { formatDeadline } from '@/utils/date';

type CardProps = {
  releases: SessionReleasesResponse | null;
  onToggle: (type: 'autoavaliacao' | 'pares') => void;
  isAttendancePending: boolean;
  isLoading: boolean;
};

function calculateSubmissionsCount(
  info: EvaluationReleaseInfo,
  isPares: boolean,
  totalAlunosConhecido?: number,
) {
  if (!isPares) {
    return { enviadas: Math.min(info.enviadas, info.esperadas), esperadas: info.esperadas };
  }

  if (totalAlunosConhecido && totalAlunosConhecido > 1) {
    const totalAlunos = totalAlunosConhecido;
    const paresPorAluno = totalAlunos - 1;
    const concluidos = Math.min(Math.floor(info.enviadas / paresPorAluno), totalAlunos);
    return { enviadas: concluidos, esperadas: totalAlunos };
  }

  const discriminant = 1 + 4 * info.esperadas;
  const sqrtD = Math.round(Math.sqrt(discriminant));

  if (sqrtD * sqrtD === discriminant && info.esperadas > 1) {
    const totalAlunos = (1 + sqrtD) / 2;
    const paresPorAluno = totalAlunos - 1;
    const concluidos = Math.min(Math.floor(info.enviadas / paresPorAluno), totalAlunos);
    return { enviadas: concluidos, esperadas: totalAlunos };
  }

  return { enviadas: Math.min(info.enviadas, info.esperadas), esperadas: info.esperadas };
}

type ToggleRowProps = {
  label: string;
  info: EvaluationReleaseInfo | undefined;
  isDisabled: boolean;
  isPares?: boolean;
  totalAlunosBase?: number;
  onToggle: () => void;
};

function EvaluationSwitch({
  label,
  isLiberada,
  isDisabled,
  onToggle,
}: {
  label: string;
  isLiberada: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLiberada}
      aria-label={label}
      disabled={isDisabled}
      onClick={onToggle}
      className={`relative h-6 w-11 shrink-0 after:absolute after:inset-x-0 after:-inset-y-2.5 rounded-full transition-colors ${
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
  );
}

function EvaluationReleaseStatus({
  stats,
  prazo,
}: {
  stats: { enviadas: number; esperadas: number };
  prazo: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-1 pl-6 text-xs text-muted">
      <span className="font-semibold text-brand-900">
        {stats.enviadas} de {stats.esperadas}{' '}
        {stats.esperadas === 1 ? 'aluno enviou' : 'alunos enviaram'}
      </span>
      <span className="flex items-center gap-1 text-[11px]">
        <CalendarIcon className="size-3.5" />
        {formatDeadline(prazo)}
      </span>
    </div>
  );
}

function EvaluationToggleRow({
  label,
  info,
  isDisabled,
  isPares = false,
  totalAlunosBase,
  onToggle,
}: ToggleRowProps) {
  const isLiberada = Boolean(info?.liberada);
  const stats = info ? calculateSubmissionsCount(info, isPares, totalAlunosBase) : null;

  return (
    <div className="flex flex-col gap-1.5 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
          {isDisabled && <LockClosedIcon className="size-4 shrink-0 text-muted" />}
          <span>{label}</span>
        </div>
        <EvaluationSwitch
          label={label}
          isLiberada={isLiberada}
          isDisabled={isDisabled}
          onToggle={onToggle}
        />
      </div>

      {isLiberada && stats && info && <EvaluationReleaseStatus stats={stats} prazo={info.prazo} />}
    </div>
  );
}

export function SessionEvaluationsCard({
  releases,
  onToggle,
  isAttendancePending,
  isLoading,
}: CardProps) {
  const totalAlunosBase = releases?.autoavaliacao?.esperadas;

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-base font-bold text-brand-900">Autoavaliação e pares</h3>
        <p className="mt-0.5 text-xs text-muted">
          Liberar formulários de avaliação dos alunos para esta sessão.
        </p>
      </div>

      {isAttendancePending && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-amber-600" />
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
          isPares={true}
          totalAlunosBase={totalAlunosBase}
          isDisabled={isAttendancePending || isLoading}
          onToggle={() => onToggle('pares')}
        />
      </div>
    </div>
  );
}
