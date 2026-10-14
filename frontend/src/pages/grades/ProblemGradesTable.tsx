import type { ProblemGradesResponse, StudentGradeRow } from '@/types/grades';
import type { ProblemFeedbacksResponse } from '@/types/feedback';
import { ProblemGradesTableToggle } from './ProblemGradesTableToggle';
import { ProblemGradesTableHeader } from './ProblemGradesTableHeader';
import { StudentGradeRowItem } from './StudentGradeRowItem';
import { ProblemGradesTableFooter } from './ProblemGradesTableFooter';
import type { EvaluationContext } from './StudentGradeField';

export type ProblemGradesTableProps = {
  data: ProblemGradesResponse;
  hideNames: boolean;
  onToggleHideNames: (val: boolean) => void;
  onSelectStudent?: (student: StudentGradeRow) => void;
  onSelectEvaluation?: (context: EvaluationContext) => void;
  feedbacks?: ProblemFeedbacksResponse | null;
};

export function ProblemGradesTable({
  data,
  hideNames,
  onToggleHideNames,
  onSelectStudent,
  onSelectEvaluation,
  feedbacks,
}: ProblemGradesTableProps) {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
      <ProblemGradesTableToggle hideNames={hideNames} onToggleHideNames={onToggleHideNames} />

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[500px] border-collapse text-left text-sm">
          <ProblemGradesTableHeader sessoes={data.sessoes} hideNames={hideNames} />
          <tbody className="divide-y divide-black/5">
            {data.alunos.length === 0 ? (
              <tr>
                <td
                  colSpan={data.sessoes.length + 2}
                  className="py-8 text-center text-sm text-muted"
                >
                  Nenhum aluno encontrado neste problema.
                </td>
              </tr>
            ) : (
              data.alunos.map((aluno) => (
                <StudentGradeRowItem
                  key={aluno.alunoId}
                  aluno={aluno}
                  sessoes={data.sessoes}
                  hideNames={hideNames}
                  onSelectStudent={onSelectStudent}
                  onSelectEvaluation={onSelectEvaluation}
                  feedbacks={feedbacks}
                />
              ))
            )}
          </tbody>
          <ProblemGradesTableFooter sessoes={data.sessoes} mediaTurma={data.mediaTurma} />
        </table>
      </div>
    </div>
  );
}
