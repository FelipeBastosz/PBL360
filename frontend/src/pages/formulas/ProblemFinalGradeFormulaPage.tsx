import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import { ProblemFormulaHeader } from './components/ProblemFormulaHeader';
import { SessionWeightRow } from './components/SessionWeightRow';
import { useProblemFormulaViewModel } from './hooks/useProblemFormulaViewModel';

function FormulaEmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-black/5 bg-white p-8 text-center shadow-xs">
      <p className="text-base font-semibold text-ink">
        Nenhuma sessão cadastrada para este problema.
      </p>
      <p className="mt-1 text-sm text-muted">
        Cadastre sessões para definir os pesos da nota final.
      </p>
    </div>
  );
}

function FormulaCalculationBadge({ isSimpleAverage }: { isSimpleAverage: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white p-4 shadow-xs">
      <span className="text-sm font-bold text-ink">Tipo de cálculo:</span>
      <span
        className={cn(
          'rounded-full px-3 py-1 text-xs font-bold',
          isSimpleAverage ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
        )}
      >
        {isSimpleAverage ? 'Média simples' : 'Média ponderada'}
      </span>
    </div>
  );
}

type ContentProps = {
  vm: ReturnType<typeof useProblemFormulaViewModel>;
};

function FormulaContent({ vm }: ContentProps) {
  return (
    <>
      <FormulaCalculationBadge isSimpleAverage={vm.isSimpleAverage} />

      <div className="overflow-hidden rounded-[18px] border border-black/5 bg-white shadow-xs">
        {vm.sessions.map((session) => {
          const pct =
            vm.totalWeight > 0
              ? ((session.peso / vm.totalWeight) * 100).toFixed(1).replace('.', ',')
              : '0,0';
          return (
            <SessionWeightRow
              key={session.sessaoId}
              session={session}
              percentage={`${pct}%`}
              method={vm.methods[session.sessaoId]}
              onChange={(w) => vm.setWeight(session.sessaoId, w)}
            />
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={vm.isRestoring || vm.isSaving}
        isLoading={vm.isRestoring}
        onClick={vm.restore}
        className="h-12 w-full rounded-2xl border-brand-900 bg-white font-semibold text-brand-900 hover:bg-brand-50"
      >
        Restaurar padrão
      </Button>

      <div className="mt-2">
        <Button
          type="button"
          onClick={vm.save}
          disabled={vm.isSaving}
          isLoading={vm.isSaving}
          className="w-full py-4 text-base font-bold shadow-lg"
        >
          Salvar fórmula
        </Button>
      </div>
    </>
  );
}

export function ProblemFinalGradeFormulaPage() {
  const { roomId = '', problemId = '' } = useParams<{ roomId: string; problemId: string }>();
  const vm = useProblemFormulaViewModel(roomId, problemId);

  if (vm.isLoading) {
    return (
      <div className="flex min-h-dvh flex-col bg-surface">
        <ProblemFormulaHeader />
        <div className="mt-16 flex justify-center">
          <Spinner className="size-8 text-brand-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface pb-16">
      <ProblemFormulaHeader />
      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-4 flex flex-col gap-4')}>
        {vm.sessions.length === 0 ? <FormulaEmptyState /> : <FormulaContent vm={vm} />}
      </main>
    </div>
  );
}

export default ProblemFinalGradeFormulaPage;
