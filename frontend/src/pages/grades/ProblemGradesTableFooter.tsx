import type { SessionColumn } from '@/types/grades';
import { formatGrade } from '@/utils/gradeFormatters';

type ProblemGradesTableFooterProps = {
  sessoes: SessionColumn[];
  mediaTurma: number | null;
};

export function ProblemGradesTableFooter({ sessoes, mediaTurma }: ProblemGradesTableFooterProps) {
  return (
    <tfoot>
      <tr className="border-t-2 border-black/10 font-bold text-ink">
        <td className="py-4 pr-4 pl-2">Média da turma</td>
        {sessoes.map((sessao) => (
          <td key={sessao.id} className="px-3 py-4 text-center text-muted">
            —
          </td>
        ))}
        <td className="py-4 pr-2 pl-3 text-right text-base text-ink">{formatGrade(mediaTurma)}</td>
      </tr>
    </tfoot>
  );
}
