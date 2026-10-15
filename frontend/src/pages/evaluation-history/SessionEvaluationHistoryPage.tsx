import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import { HideNamesToggle } from './components/HideNamesToggle';
import { HistoryExportActions } from './components/HistoryExportActions';
import { HistoryHeader } from './components/HistoryHeader';
import { HistoryStudentCard } from './components/HistoryStudentCard';
import { useEvaluationHistory } from './hooks/useEvaluationHistory';
import { useHideNames } from './hooks/useHideNames';
import { useHistoryExport } from './hooks/useHistoryExport';

type HistoryListProps = {
  students: StudentEvaluationHistoryItem[];
  hideNames: boolean;
};

function HistoryList({ students, hideNames }: HistoryListProps) {
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
          <HistoryStudentCard student={student} hideNames={hideNames} index={index} />
        </li>
      ))}
    </ul>
  );
}

export default function SessionEvaluationHistoryPage() {
  const { roomId, problemId, sessionId } = useParams();
  const navigate = useNavigate();
  const { students, isLoading, error } = useEvaluationHistory(sessionId);
  const { hideNames, setHideNames } = useHideNames();
  const { exportPdf, exportExcel } = useHistoryExport(students, hideNames);

  return (
    <div className="min-h-dvh bg-surface">
      <HistoryHeader
        onBack={() => navigate(`/turmas/${roomId}/problemas/${problemId}/sessoes/${sessionId}`)}
      />
      <main className="mx-auto w-full px-[18px] pb-[160px] sm:max-w-2xl sm:px-4 sm:pt-4 sm:pb-12 lg:max-w-5xl">
        <HideNamesToggle hideNames={hideNames} onChange={setHideNames} />
        {error && <Alert tone="error">{error.message}</Alert>}
        {isLoading ? (
          <div className="mt-10 flex justify-center">
            <Spinner className="size-8 text-brand-900" />
          </div>
        ) : (
          !error && <HistoryList students={students} hideNames={hideNames} />
        )}
        <HistoryExportActions
          disabled={isLoading || students.length === 0}
          onExportPdf={exportPdf}
          onExportExcel={exportExcel}
        />
      </main>
    </div>
  );
}
