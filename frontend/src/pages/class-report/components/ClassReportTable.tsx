import { useMemo, useState } from 'react';
import type { ClassReportProblem, ClassReportStudent } from '@/types/class-report';
import { ClassReportTableToggle } from './ClassReportTableToggle';
import { ClassReportTableHeader } from './ClassReportTableHeader';
import { ClassReportRowItem } from './ClassReportRowItem';

export type ClassReportTableProps = {
  problemas: ClassReportProblem[];
  alunos: ClassReportStudent[];
  hideNames?: boolean;
  onToggleHideNames?: (val: boolean) => void;
};

export function ClassReportTable({
  problemas,
  alunos,
  hideNames: controlledHideNames,
  onToggleHideNames,
}: ClassReportTableProps) {
  const [uncontrolledHideNames, setUncontrolledHideNames] = useState(false);
  const isControlled = controlledHideNames !== undefined;
  const hideNames = isControlled ? controlledHideNames : uncontrolledHideNames;
  const handleToggle = onToggleHideNames ?? setUncontrolledHideNames;

  const sortedProblemas = useMemo(
    () => [...problemas].sort((a, b) => a.ordem - b.ordem),
    [problemas],
  );

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
      <ClassReportTableToggle hideNames={hideNames} onToggleHideNames={handleToggle} />
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[500px] border-collapse text-left text-sm">
          <ClassReportTableHeader problemas={sortedProblemas} hideNames={hideNames} />
          <tbody className="divide-y divide-black/5">
            {alunos.length === 0 ? (
              <tr>
                <td
                  colSpan={sortedProblemas.length + 2}
                  className="py-8 text-center text-sm text-muted"
                >
                  Não há alunos vinculados a esta turma.
                </td>
              </tr>
            ) : (
              alunos.map((aluno) => (
                <ClassReportRowItem
                  key={aluno.id}
                  aluno={aluno}
                  problemas={sortedProblemas}
                  hideNames={hideNames}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
