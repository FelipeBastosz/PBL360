import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';
import type { FinalGradeSessionWeight } from '@/types/formula';
import { ProblemFormulaHeader } from './components/ProblemFormulaHeader';
import { SessionWeightRow } from './components/SessionWeightRow';
import { useProblemFormulaViewModel } from './hooks/useProblemFormulaViewModel';

const SECONDARY_BTN =
  'w-full rounded-2xl border border-black/5 bg-white py-3.5 text-sm font-semibold text-brand-900 shadow-xs transition-colors hover:bg-brand-50 disabled:opacity-50';

function ProblemFormulaLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <ProblemFormulaHeader />
      <div className="mt-16 flex justify-center">
        <Spinner className="size-8 text-brand-900" />
      </div>
    </div>
  );
}

function CalculationTypeBadge({ isSimpleAverage }: { isSimpleAverage: boolean }) {
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

function SessionWeightsList({
  sessions,
  methods,
  totalWeight,
  onWeightChange,
}: {
  sessions: FinalGradeSessionWeight[];
  methods: Record<string, string>;
  totalWeight: number;
  onWeightChange: (sessaoId: string, weight: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-black/5 bg-white shadow-xs">
      {sessions.map((session) => {
        const pct =
          totalWeight > 0
            ? ((session.peso / totalWeight) * 100).toFixed(1).replace('.', ',')
            : '0,0';
        return (
          <SessionWeightRow
            key={session.sessaoId}
            session={session}
            percentage={`${pct}%`}
            method={methods[session.sessaoId]}
            onChange={(w) => onWeightChange(session.sessaoId, w)}
          />
        );
      })}
    </div>
  );
}

function ProblemFormulaActions({
  isRestoring,
  isSaving,
  hasSessions,
  onRestore,
  onSave,
}: {
  isRestoring: boolean;
  isSaving: boolean;
  hasSessions: boolean;
  onRestore: () => void;
  onSave: () => void;
}) {
  return (
    <>
      <button
        type="button"
        disabled={isRestoring || isSaving}
        onClick={onRestore}
        className={SECONDARY_BTN}
      >
        Restaurar padrão (Média simples)
      </button>

      <div className="mt-2">
        <Button
          onClick={onSave}
          disabled={!hasSessions || isSaving}
          isLoading={isSaving}
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
    return <ProblemFormulaLoading />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface pb-16">
      <ProblemFormulaHeader />

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-4 flex flex-col gap-4')}>
        <CalculationTypeBadge isSimpleAverage={vm.isSimpleAverage} />

        <SessionWeightsList
          sessions={vm.sessions}
          methods={vm.methods}
          totalWeight={vm.totalWeight}
          onWeightChange={vm.setWeight}
        />

        <ProblemFormulaActions
          isRestoring={vm.isRestoring}
          isSaving={vm.isSaving}
          hasSessions={vm.sessions.length > 0}
          onRestore={vm.restore}
          onSave={vm.save}
        />
      </main>
    </div>
  );
}

export default ProblemFinalGradeFormulaPage;
