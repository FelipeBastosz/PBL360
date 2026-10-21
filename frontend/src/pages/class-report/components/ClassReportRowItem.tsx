import type { ClassReportProblem, ClassReportStudent } from '@/types/class-report';
import { formatGrade } from '@/utils/gradeFormatters';
import { cn } from '@/utils/cn';

type ClassReportRowItemProps = {
  aluno: ClassReportStudent;
  problemas: ClassReportProblem[];
  hideNames: boolean;
};

function getGradeToneClass(grade: number | null | undefined): string {
  if (grade === null || grade === undefined) return 'text-muted';
  return grade >= 7.0 ? 'text-success' : 'text-danger';
}

function StudentIdentifierCell({
  aluno,
  hideNames,
}: {
  aluno: ClassReportStudent;
  hideNames: boolean;
}) {
  const displayTitle = hideNames ? aluno.matricula || 'Sem matrícula' : aluno.nome;

  return (
    <td
      className="sticky left-0 z-10 w-[200px] min-w-[160px] max-w-[240px] truncate border-r border-black/5 bg-white py-3.5 pr-4 pl-4 text-sm font-medium text-ink group-hover:bg-brand-50/50"
      title={displayTitle}
    >
      {hideNames ? (
        aluno.matricula ? (
          aluno.matricula
        ) : (
          <span className="text-xs font-normal italic text-muted/70">Sem matrícula</span>
        )
      ) : (
        aluno.nome
      )}
    </td>
  );
}

function AverageCell({ aluno }: { aluno: ClassReportStudent }) {
  const tone = getGradeToneClass(aluno.mediaGeral);

  return (
    <td className="py-3.5 pr-4 pl-3 text-right">
      <div className="flex items-center justify-end gap-1.5">
        <span className={cn('font-bold', tone)}>{formatGrade(aluno.mediaGeral)}</span>
        {aluno.isParcial && (
          <span
            className="inline-flex items-center rounded-full border border-warning-line/40 bg-warning-soft px-1.5 py-0.5 text-[10px] font-semibold text-warning"
            title="Média parcial: faltam notas para compor a média final"
            aria-label="Média parcial: faltam notas para compor a média final"
          >
            Parcial
          </span>
        )}
      </div>
    </td>
  );
}

export function ClassReportRowItem({ aluno, problemas, hideNames }: ClassReportRowItemProps) {
  return (
    <tr className="group transition-colors duration-150 hover:bg-brand-50/30">
      <StudentIdentifierCell aluno={aluno} hideNames={hideNames} />
      {problemas.map((problema) => {
        const grade =
          aluno.notasProblemas.find((np) => np.problemaId === problema.id)?.notaFinal ?? null;
        return (
          <td
            key={problema.id}
            className={cn('px-3 py-3.5 text-center font-semibold', getGradeToneClass(grade))}
          >
            {formatGrade(grade)}
          </td>
        );
      })}
      <AverageCell aluno={aluno} />
    </tr>
  );
}
