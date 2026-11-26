import { UserGroupIcon } from '@heroicons/react/24/outline';

export function SessionReportEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-border-subtle bg-elevated p-8 text-center shadow-sm sm:p-12">
      <div className="flex size-16 items-center justify-center rounded-full bg-brand-soft text-brand-accent">
        <UserGroupIcon className="size-8" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-ink">
        Não há alunos vinculados a esta sessão.
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Assim que novos alunos entrarem na turma, as notas consolidadas aparecerão aqui.
      </p>
    </div>
  );
}
