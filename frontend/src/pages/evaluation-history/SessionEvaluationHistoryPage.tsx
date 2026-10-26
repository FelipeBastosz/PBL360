import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { AdjustEvaluationGradeModal } from '@/pages/evaluations/components/AdjustEvaluationGradeModal';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import { HideNamesToggle } from './components/HideNamesToggle';
import { HistoryExportActions } from './components/HistoryExportActions';
import { HistoryHeader } from './components/HistoryHeader';
import { HistoryStudentCard } from './components/HistoryStudentCard';
import { useEvaluationHistory } from './hooks/useEvaluationHistory';
import { useHideNames } from './hooks/useHideNames';
import { useGradeAdjustment } from './hooks/useGradeAdjustment';

type HistoryListProps = {
  students: StudentEvaluationHistoryItem[];
  hideNames: boolean;
  onSelect: (student: StudentEvaluationHistoryItem) => void;
};

function HistoryList({ students, hideNames, onSelect }: HistoryListProps) {
  if (students.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-muted">
        Nenhum aluno com presença registrada nesta sessão.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-[11.4px]">
      {students.map((student, index) => (
        <li key={student.alunoId}>
          <HistoryStudentCard
            student={student}
            hideNames={hideNames}
            index={index}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}

// The page is also reachable from /sessoes/:sessionId/historico, without room and problem.
function sessionBackUrl(roomId?: string, problemId?: string, sessionId?: string) {
  return roomId && problemId
    ? `/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`
    : `/sessoes/${sessionId}`;
}

export default function SessionEvaluationHistoryPage() {
  const { roomId, problemId, sessionId } = useParams();
  const navigate = useNavigate();
  const { students, isLoading, error, handleAdjusted } = useEvaluationHistory(sessionId);
  const adjustment = useGradeAdjustment(sessionId, handleAdjusted);
  const { hideNames, setHideNames } = useHideNames();

  return (
    <div className="min-h-dvh bg-surface">
      <HistoryHeader onBack={() => navigate(sessionBackUrl(roomId, problemId, sessionId))} />
      <main className="mx-auto w-full px-[18px] pb-[160px] sm:max-w-2xl sm:px-4 sm:pt-4 sm:pb-12 lg:max-w-5xl">
        <HideNamesToggle hideNames={hideNames} onChange={setHideNames} />
        {error && <Alert tone="error">{error.message}</Alert>}
        {isLoading ? (
          <div className="mt-10 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : (
          !error && (
            <HistoryList
              students={students}
              hideNames={hideNames}
              onSelect={adjustment.setSelected}
            />
          )
        )}
        <HistoryExportActions />
      </main>
      <AdjustEvaluationGradeModal
        isOpen={Boolean(adjustment.selected)}
        student={adjustment.selected}
        hideNames={hideNames}
        onClose={() => adjustment.setSelected(null)}
        onSubmit={adjustment.save}
        isLoading={adjustment.isSaving}
      />
    </div>
  );
}
