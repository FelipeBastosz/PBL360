import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { PAGE_CONTAINER_CLASS } from '@/components/ui/cardStyles';
import { ProblemGradesHeader } from './ProblemGradesHeader';
import { ProblemGradesTable } from './ProblemGradesTable';
import { ProblemGradesActions } from './ProblemGradesActions';
import { StudentFeedbackModal } from './StudentFeedbackModal';
import { GeneralFeedbackModal } from './GeneralFeedbackModal';
import { useProblemGradesController } from './hooks/useProblemGradesController';
import { cn } from '@/utils/cn';

export function ProblemGradesPage() {
  const ctrl = useProblemGradesController();

  return (
    <div className="min-h-dvh bg-surface pb-16">
      <ProblemGradesHeader room={ctrl.room} problem={ctrl.problem} />

      <main className={cn(PAGE_CONTAINER_CLASS, 'mt-6 flex flex-col gap-6')}>
        {ctrl.error && <Alert tone="error">{ctrl.error}</Alert>}

        {ctrl.isLoading ? (
          <div className="mt-16 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : ctrl.grades ? (
          <>
            <ProblemGradesTable
              data={ctrl.grades}
              hideNames={ctrl.hideNames}
              onToggleHideNames={ctrl.setHideNames}
              onSelectStudent={ctrl.setSelectedStudent}
            />
            <ProblemGradesActions onOpenGeneralModal={() => ctrl.setIsGeneralModalOpen(true)} />
          </>
        ) : null}
      </main>

      <StudentFeedbackModal
        isOpen={ctrl.selectedStudent !== null}
        onClose={() => ctrl.setSelectedStudent(null)}
        student={ctrl.selectedStudent}
        existingFeedback={ctrl.currentStudentFeedback}
        hideNames={ctrl.hideNames}
        roomId={ctrl.roomId}
        problemId={ctrl.problemId}
        onSaved={ctrl.handleStudentFeedbackSaved}
      />

      <GeneralFeedbackModal
        isOpen={ctrl.isGeneralModalOpen}
        onClose={() => ctrl.setIsGeneralModalOpen(false)}
        existingFeedback={ctrl.feedbacks?.geral ?? null}
        roomId={ctrl.roomId}
        problemId={ctrl.problemId}
        onSaved={ctrl.handleGeneralFeedbackSaved}
      />
    </div>
  );
}

export default ProblemGradesPage;
