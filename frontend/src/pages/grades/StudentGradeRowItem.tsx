import type { SessionColumn, StudentGradeRow } from '@/types/grades';
import type { ProblemFeedbacksResponse } from '@/types/feedback';
import { formatGrade } from '@/utils/gradeFormatters';
import { cn } from '@/utils/cn';
import { StudentGradeField, type EvaluationContext } from './StudentGradeField';

type StudentGradeRowItemProps = {
  aluno: StudentGradeRow;
  sessoes: SessionColumn[];
  hideNames: boolean;
  onSelectStudent?: (student: StudentGradeRow) => void;
  onSelectEvaluation?: (context: EvaluationContext) => void;
  feedbacks?: ProblemFeedbacksResponse | null;
};

function FinalGradeCell({ notaFinal }: { notaFinal: number | null }) {
  const isPassing = notaFinal !== null && notaFinal >= 7.0;
  const isFailing = notaFinal !== null && notaFinal < 7.0;

  return (
    <td
      className={cn(
        'py-3.5 pr-4 pl-3 text-right font-semibold',
        isPassing && 'text-success',
        isFailing && 'text-danger',
        !isPassing && !isFailing && 'text-muted',
      )}
    >
      {formatGrade(notaFinal)}
    </td>
  );
}

export function StudentGradeRowItem({
  aluno,
  sessoes,
  hideNames,
  onSelectStudent,
  onSelectEvaluation,
  feedbacks,
}: StudentGradeRowItemProps) {
  const displayName = hideNames ? aluno.matricula || '—' : aluno.nome;
  const studentFeedback = feedbacks?.alunos.find((a) => a.alunoId === aluno.alunoId)?.feedback;

  return (
    <tr className="group transition-colors duration-150">
      <td className="py-3.5 pr-4 pl-4 font-medium text-ink">{displayName}</td>
      {sessoes.map((sessao) => {
        const gradeItem = aluno.sessoes.find((s) => s.sessaoId === sessao.id);
        return (
          <StudentGradeField
            key={sessao.id}
            aluno={aluno}
            sessao={sessao}
            gradeItem={gradeItem}
            existingFeedback={studentFeedback}
            onSelectEvaluation={onSelectEvaluation}
            onSelectStudent={onSelectStudent}
            hideNames={hideNames}
          />
        );
      })}
      <FinalGradeCell notaFinal={aluno.notaFinal} />
    </tr>
  );
}
