import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useToast } from '@/hooks/useToast';
import { ROUTES } from '@/routes/paths';
import { performanceTableService } from '@/services/performance-table.service';
import { problemService } from '@/services/problem.service';
import type { Criterion, PerformanceTable } from '@/types/performanceTable';
import { readApplyTarget } from '@/utils/navigationState';

function DetailHeader({ title }: { title: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-brand-900 px-4 text-white">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-1">
          <ChevronLeftIcon className="size-6" strokeWidth={2} />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
      <UserAvatar user={user} />
    </header>
  );
}

function DescriptionCard({ description }: { description: string }) {
  return (
    <div className="rounded-[14px] border border-black/5 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-brand-900">Descrição</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

function CriterionItem({ criterion }: { criterion: Criterion }) {
  return (
    <div className="border-b border-black/5 px-4 py-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-brand-900">{criterion.nome}</span>
        <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-ink">
          {criterion.peso}
        </span>
      </div>
      {criterion.descricao && <p className="mt-1 text-xs text-muted">{criterion.descricao}</p>}
    </div>
  );
}

function CriteriaListCard({ criteria }: { criteria: Criterion[] }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-black/5 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 text-sm font-semibold text-brand-900">
        <span>Critério</span>
        <span>Peso</span>
      </div>
      <div>
        {criteria.map((item) => (
          <CriterionItem key={item.id} criterion={item} />
        ))}
      </div>
    </div>
  );
}

type DetailActionsProps = { onApply: () => void; isApplying: boolean };

function DetailActions({ onApply, isApplying }: DetailActionsProps) {
  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={onApply}
        disabled={isApplying}
        className="w-full rounded-[14px] bg-brand-900 py-3.5 text-base font-bold text-white shadow-lg transition-transform hover:bg-brand-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Aplicar fórmula
      </button>
    </div>
  );
}

// Links the table to the problem the tutor came from (see readApplyTarget).
function useApplyTable(tableId: string) {
  const navigate = useNavigate();
  const target = readApplyTarget(useLocation().state);
  const { notify } = useToast();
  const { run, isLoading, error } = useAsyncAction(problemService.changePerformanceTable);

  async function apply() {
    if (!target) return;
    const result = await run(target.roomId, target.problemId, tableId);
    if (!result.ok) return;
    notify({ tone: 'success', message: 'Fórmula aplicada ao problema.' });
    const problemPath = ROUTES.problemSessions
      .replace(':roomId', target.roomId)
      .replace(':problemId', target.problemId);
    navigate(problemPath, { replace: true });
  }

  return { canApply: target !== null, apply, isApplying: isLoading, applyError: error };
}

function DetailContent({ table }: { table: PerformanceTable }) {
  const { canApply, apply, isApplying, applyError } = useApplyTable(table.id);

  return (
    <>
      {table.descricao && <DescriptionCard description={table.descricao} />}
      <CriteriaListCard criteria={table.criterios} />
      {applyError && <Alert tone="error">{applyError.message}</Alert>}
      {canApply && <DetailActions onApply={apply} isApplying={isApplying} />}
    </>
  );
}

export function PerformanceTableDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [table, setTable] = useState<PerformanceTable | null>(null);

  const fetchTable = useCallback(async (): Promise<PerformanceTable> => {
    return performanceTableService.getById(id!);
  }, [id]);

  const { run, isLoading, error } = useAsyncAction(fetchTable);

  useEffect(() => {
    run().then((result) => {
      if (result.ok) setTable(result.data);
    });
  }, [run]);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <DetailHeader title={table?.nome || 'Detalhes da fórmula'} />

      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {isLoading && (
          <div className="mt-12 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        )}

        {error && <Alert tone="error">{error.message}</Alert>}

        {table && <DetailContent table={table} />}
      </main>
    </div>
  );
}

export default PerformanceTableDetailPage;
