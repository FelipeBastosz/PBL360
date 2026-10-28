import { Link } from 'react-router-dom';
import type { SessionEvaluationSummary } from '@/types/evaluation';
import type { StudentSessionGrade } from '@/types/grades';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatGrade } from '@/utils/gradeFormatters';

type StudentCardProps = {
  student: SessionEvaluationSummary;
  sessionGrade?: StudentSessionGrade;
  evaluationUrl: string;
  disabled?: boolean;
};

const isEvaluatedByStudents = (grade?: StudentSessionGrade): grade is StudentSessionGrade =>
  grade?.situacao === 'AVALIADA' &&
  (grade.modalidade === 'AUTOAVALIACAO' || grade.modalidade === 'PARES');

function EvaluatedBadge({ grade }: { grade: StudentSessionGrade }) {
  return (
    <span className="inline-flex items-center rounded-md border border-success/30 bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
      Avaliada · {formatGrade(grade.nota)}
    </span>
  );
}

function EvaluationBadges({
  student,
  sessionGrade,
}: {
  student: SessionEvaluationSummary;
  sessionGrade?: StudentSessionGrade;
}) {
  const evaluated = student.status === 'PENDENTE' && isEvaluatedByStudents(sessionGrade);
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {student.presenca === 'ausente' && (
        <span className="inline-flex items-center rounded-md bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
          Falta
        </span>
      )}
      {student.presenca === 'justificado' && (
        <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-800">
          Falta justificada
        </span>
      )}
      {evaluated && sessionGrade && <EvaluatedBadge grade={sessionGrade} />}
      {student.status === 'PENDENTE' && !evaluated && (
        <span className="inline-flex items-center rounded-md bg-black/5 px-2 py-0.5 text-xs font-medium text-muted">
          Pendente
        </span>
      )}
      {student.status === 'RASCUNHO' && (
        <span className="inline-flex items-center rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-900">
          Rascunho
        </span>
      )}
      {student.status === 'ENVIADA' && (
        <span className="inline-flex items-center rounded-md border border-success/30 bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
          Enviada {student.notaSessao !== null && `· ${student.notaSessao.toFixed(1)}`}
        </span>
      )}
    </div>
  );
}

function ActionButton({
  disabled,
  isEnviada,
  isRascunho,
  url,
  studentName,
}: {
  disabled?: boolean;
  isEnviada: boolean;
  isRascunho: boolean;
  url: string;
  studentName: string;
}) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className="w-24 shrink-0 cursor-not-allowed rounded-[10px] bg-brand-900/40 py-2 text-center text-sm font-semibold text-white"
      >
        Avaliar
      </button>
    );
  }

  return (
    <Link
      to={url}
      state={{ studentName }}
      className={`w-24 shrink-0 rounded-[10px] py-2 text-center text-sm font-semibold transition ${
        isEnviada
          ? 'border border-brand-900 bg-white text-brand-900 hover:bg-brand-50'
          : 'bg-brand-900 text-white hover:bg-brand-800'
      }`}
    >
      {isEnviada ? 'Editar' : isRascunho ? 'Continuar' : 'Avaliar'}
    </Link>
  );
}

export function StudentEvaluationCard({
  student,
  sessionGrade,
  evaluationUrl,
  disabled,
}: StudentCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          user={{ id: student.alunoId, nome: student.nome, possuiFoto: true }}
          className="size-11 bg-brand-700 text-white"
        />
        <div className="flex min-w-0 flex-col">
          <h3 className="line-clamp-2 text-base font-bold break-words text-ink">{student.nome}</h3>
          <EvaluationBadges student={student} sessionGrade={sessionGrade} />
        </div>
      </div>
      <ActionButton
        disabled={disabled}
        isEnviada={student.status === 'ENVIADA'}
        isRascunho={student.status === 'RASCUNHO'}
        url={evaluationUrl}
        studentName={student.nome}
      />
    </div>
  );
}
