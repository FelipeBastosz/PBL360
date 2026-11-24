import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { performanceTableService } from '@/services/performance-table.service';
import type { PerformanceTable } from '@/types/performanceTable';
import { MyFormulasHeader } from './components/MyFormulasHeader';

function CriteriaListCard({ criteria }: { criteria: PerformanceTable['criterios'] }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border-subtle bg-elevated shadow-sm">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 text-sm font-semibold text-brand-accent">
        <span>Critério</span>
        <span>Peso</span>
      </div>
      <div>
        {criteria.map((item) => (
          <div key={item.id} className="border-b border-border-subtle px-4 py-3 last:border-b-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-accent">{item.nome}</span>
              <span className="inline-flex min-w-9 items-center justify-center rounded-full bg-subtle px-3 py-1 text-xs font-bold text-ink">
                {item.peso}
              </span>
            </div>
            {item.descricao && <p className="mt-1 text-xs text-muted">{item.descricao}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MyFormulaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [table, setTable] = useState<PerformanceTable | null>(null);

  const fetchTable = useCallback(() => performanceTableService.getById(id!), [id]);
  const { run, isLoading, error } = useAsyncAction(fetchTable);

  useEffect(() => {
    run().then((result) => {
      if (result.ok) setTable(result.data);
    });
  }, [run]);

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <MyFormulasHeader title={table?.nome || 'Detalhes da fórmula'} />
      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4 px-4">
        {isLoading && (
          <div className="mt-12 flex justify-center">
            <Spinner className="size-8 text-brand-accent" />
          </div>
        )}
        {error && <Alert tone="error">{error.message}</Alert>}
        {table && (
          <>
            {table.descricao && (
              <div className="rounded-[14px] border border-border-subtle bg-elevated p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-brand-accent">Descrição</h2>
                <p className="mt-1 text-sm text-muted">{table.descricao}</p>
              </div>
            )}
            <CriteriaListCard criteria={table.criterios} />
          </>
        )}
      </main>
    </div>
  );
}

export default MyFormulaDetailPage;
