import type { KeyboardEvent } from 'react';
import type { SessionColumn, StudentGradeRow } from '@/types/grades';
import { formatGrade, formatSessionCell } from '@/utils/gradeFormatters';
import { cn } from '@/utils/cn';

type StudentGradeRowItemProps = {
  aluno: StudentGradeRow;
  sessoes: SessionColumn[];
  hideNames: boolean;
  onSelectStudent: (student: StudentGradeRow) => void;
};

function SessionGradeCells({
  aluno,
  sessoes,
}: {
  aluno: StudentGradeRow;
  sessoes: SessionColumn[];
}) {
  return sessoes.map((sessao) => {
    const gradeItem = aluno.sessoes.find((s) => s.sessaoId === sessao.id);
    return (
      <td key={sessao.id} className="px-3 py-3.5 text-center text-muted group-hover:text-ink">
        {formatSessionCell(gradeItem?.nota, gradeItem?.situacao)}
      </td>
    );
  });
}

function FinalGradeCell({ notaFinal }: { notaFinal: number | null }) {
  const isPassing = notaFinal !== null && notaFinal >= 7.0;
  const isFailing = notaFinal !== null && notaFinal < 7.0;

  return (
    <td
      className={cn(
        'py-3.5 pr-2 pl-3 text-right font-semibold',
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
}: StudentGradeRowItemProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectStudent(aluno);
    }
  };

  const displayName = hideNames ? aluno.matricula || '—' : aluno.nome;

  return (
    <tr
      role="button"
      tabIndex={0}
      aria-label={`Ver feedback de ${displayName}`}
      onClick={() => onSelectStudent(aluno)}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer transition-colors duration-150 hover:bg-brand-50/70 focus-visible:bg-brand-50 focus-visible:outline-none"
    >
      <td className="py-3.5 pr-4 pl-2 font-medium text-ink group-hover:text-brand-900">
        {displayName}
      </td>
      <SessionGradeCells aluno={aluno} sessoes={sessoes} />
      <FinalGradeCell notaFinal={aluno.notaFinal} />
    </tr>
  );
}
