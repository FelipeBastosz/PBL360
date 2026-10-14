import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { useEvaluationHistory } from './hooks/useEvaluationHistory';
import { EvaluationHistoryHeader } from './components/EvaluationHistoryHeader';
import { EvaluationHistoryStudentCard } from './components/EvaluationHistoryStudentCard';
import { AdjustEvaluationGradeModal } from './components/AdjustEvaluationGradeModal';

function NameVisibilityToggle({
  hideNames,
  onToggle,
}: {
  hideNames: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2.5 py-1">
      <span className="text-xs font-semibold text-ink">Ocultar nomes</span>
      <button
        type="button"
        role="switch"
        aria-label="Ocultar nomes"
        aria-checked={hideNames}
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-brand-900',
          hideNames ? 'bg-brand-900' : 'bg-gray-300',
        )}
      >
        <span
          className={cn(
            'inline-block size-4 transform rounded-full bg-white transition-transform shadow-xs',
            hideNames ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </div>
  );
}

function ExportActions() {
  return (
    <div className="mt-2 flex flex-col gap-2.5">
      <Button
        type="button"
        variant="primary"
        className="w-full rounded-2xl py-3.5 text-sm font-semibold shadow-xs"
        onClick={() => {}}
      >
        Exportar em PDF
      </Button>
      <Button
        type="button"
        variant="primary"
        className="w-full rounded-2xl py-3.5 text-sm font-semibold shadow-xs"
        onClick={() => {}}
      >
        Exportar em Excel
      </Button>
    </div>
  );
}

export default function EvaluationHistoryPage() {
  const { user } = useAuth();
  const history = useEvaluationHistory();

  return (
    <div className="min-h-dvh bg-surface pb-12">
      <EvaluationHistoryHeader user={user} backUrl={history.backUrl} />

      <main className="mx-auto mt-4 flex w-full max-w-md flex-col gap-3.5 px-4">
        <NameVisibilityToggle
          hideNames={history.hideNames}
          onToggle={() => history.setHideNames(!history.hideNames)}
        />

        {history.error && <Alert tone="error">{history.error}</Alert>}

        {history.isLoading ? (
          <div className="mt-12 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {history.students.map((student) => (
                <EvaluationHistoryStudentCard
                  key={student.alunoId}
                  student={student}
                  hideNames={history.hideNames}
                  onSelect={history.setSelectedStudent}
                />
              ))}
            </div>

            <ExportActions />
          </>
        )}
      </main>

      <AdjustEvaluationGradeModal
        isOpen={Boolean(history.selectedStudent)}
        student={history.selectedStudent}
        hideNames={history.hideNames}
        onClose={() => history.setSelectedStudent(null)}
        onSubmit={history.handleSaveAdjustment}
        isLoading={history.isSaving}
      />
    </div>
  );
}
