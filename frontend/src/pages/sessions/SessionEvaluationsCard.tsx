import { LockClosedIcon } from '@heroicons/react/24/outline';

function EvaluationToggleRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between opacity-50">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <LockClosedIcon className="size-4 text-muted" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">Bloqueada</span>
        <div className="h-5 w-9 rounded-full bg-black/20 p-0.5 cursor-not-allowed">
          <div className="size-4 rounded-full bg-white shadow-xs" />
        </div>
      </div>
    </div>
  );
}

export function SessionEvaluationsCard() {
  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <span className="absolute right-4 top-4 rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-muted">
        Em breve
      </span>
      <div>
        <h3 className="text-sm font-bold text-brand-900">Autoavaliação e pares</h3>
        <p className="mt-0.5 text-xs text-muted">
          Os alunos só veem os formulários quando você libera.
        </p>
      </div>

      <div className="mt-1 flex flex-col gap-3.5 border-t border-black/5 pt-3.5">
        <EvaluationToggleRow label="Autoavaliação dos alunos" />
        <EvaluationToggleRow label="Avaliação entre pares" />
      </div>
    </div>
  );
}
