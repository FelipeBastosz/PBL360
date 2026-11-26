import { Link } from 'react-router-dom';
import type { SessionEvaluationSummary } from '@/types/evaluation';
import type { StudentSessionGrade } from '@/types/grades';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatGrade } from '@/utils/formatGrade';

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
  const isAusente = student.presenca === 'ausente' || student.presenca === 'justificado';
  const evaluated = student.status === 'PENDENTE' && isEvaluatedByStudents(sessionGrade);

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {student.presenca === 'ausente' && (
        <span className="inline-flex items-center rounded-md bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
          Falta
        </span>
      )}
      {student.presenca === 'justificado' && (
        <span className="inline-flex items-center rounded-md bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
          Falta justificada
        </span>
      )}
      {evaluated && sessionGrade && <EvaluatedBadge grade={sessionGrade} />}

      {!isAusente && student.status === 'PENDENTE' && !evaluated && (
        <span className="inline-flex items-center rounded-md bg-subtle px-2 py-0.5 text-xs font-medium text-muted">
          Pendente
        </span>
      )}

      {student.status === 'RASCUNHO' && (
        <span className="inline-flex items-center rounded-md border border-brand-border bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-accent">
          Rascunho
        </span>
      )}
      {student.status === 'ENVIADA' && (
        <span className="inline-flex items-center rounded-md border border-success/30 bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
          Enviada {student.notaSessao !== null && `· ${formatGrade(student.notaSessao)}`}
        </span>
      )}
    </div>
  );
}

function DisabledActionButton({ label, className }: { label: string; className: string }) {
  return (
    <button
      type="button"
      disabled
      className={`w-24 shrink-0 cursor-not-allowed rounded-[10px] py-2 text-center text-sm font-semibold ${className}`}
    >
      {label}
    </button>
  );
}

function ActionButton({
  disabled,
  isAusente,
  isEnviada,
  isRascunho,
  url,
  studentName,
}: {
  disabled?: boolean;
  isAusente: boolean;
  isEnviada: boolean;
  isRascunho: boolean;
  url: string;
  studentName: string;
}) {
  if (isAusente) {
    return <DisabledActionButton label="Ausente" className="bg-subtle text-muted" />;
  }

  if (disabled) {
    return <DisabledActionButton label="Avaliar" className="bg-brand-primary/40 text-white" />;
  }

  const linkStyle = isEnviada
    ? 'border border-brand-accent bg-elevated text-brand-accent hover:bg-brand-soft'
    : 'bg-brand-primary text-white hover:bg-brand-primary-hover';

  const label = isEnviada ? 'Editar' : isRascunho ? 'Continuar' : 'Avaliar';

  return (
    <Link
      to={url}
      state={{ studentName }}
      className={`w-24 shrink-0 rounded-[10px] py-2 text-center text-sm font-semibold transition ${linkStyle}`}
    >
      {label}
    </Link>
  );
}

export function StudentEvaluationCard({
  student,
  sessionGrade,
  evaluationUrl,
  disabled,
}: StudentCardProps) {
  const isAusente = student.presenca === 'ausente' || student.presenca === 'justificado';

  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] border border-border-subtle bg-elevated p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          user={{ id: student.alunoId, nome: student.nome, possuiFoto: true }}
          className="size-11 bg-brand-primary-hover text-white"
        />
        <div className="flex min-w-0 flex-col">
          <h3 className="line-clamp-2 text-base font-bold break-words text-ink">{student.nome}</h3>
          <EvaluationBadges student={student} sessionGrade={sessionGrade} />
        </div>
      </div>
      <ActionButton
        disabled={disabled}
        isAusente={isAusente}
        isEnviada={student.status === 'ENVIADA'}
        isRascunho={student.status === 'RASCUNHO'}
        url={evaluationUrl}
        studentName={student.nome}
      />
    </div>
  );
}
