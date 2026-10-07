import { Link } from 'react-router-dom';
import type { SessionEvaluationSummary } from '@/types/evaluation';
import { UserAvatar } from '@/components/ui/UserAvatar';

type StudentCardProps = {
  student: SessionEvaluationSummary;
  evaluationUrl: string;
  disabled?: boolean;
};

function EvaluationBadges({ student }: { student: SessionEvaluationSummary }) {
  const isEnviada = student.status === 'ENVIADA';
  const isRascunho = student.status === 'RASCUNHO';
  const isPendente = student.status === 'PENDENTE';

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
      {isPendente && (
        <span className="inline-flex items-center rounded-md bg-black/5 px-2 py-0.5 text-xs font-medium text-muted">
          Pendente
        </span>
      )}
      {isRascunho && (
        <span className="inline-flex items-center rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-900">
          Rascunho
        </span>
      )}
      {isEnviada && (
        <span className="inline-flex items-center rounded-md border border-success/30 bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
          Enviada {student.notaSessao !== null && `· ${student.notaSessao.toFixed(1)}`}
        </span>
      )}
    </div>
  );
}

type ActionButtonProps = {
  disabled?: boolean;
  isEnviada: boolean;
  isRascunho: boolean;
  evaluationUrl: string;
};

function EvaluationActionButton({
  disabled,
  isEnviada,
  isRascunho,
  evaluationUrl,
}: ActionButtonProps) {
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
      to={evaluationUrl}
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

export function StudentEvaluationCard({ student, evaluationUrl, disabled }: StudentCardProps) {
  const isEnviada = student.status === 'ENVIADA';
  const isRascunho = student.status === 'RASCUNHO';

  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          user={{
            id: student.alunoId,
            nome: student.nome,
            possuiFoto: true,
          }}
          className="size-11 bg-brand-700 text-white"
        />

        <div className="flex min-w-0 flex-col">
          <h3 className="truncate text-base font-bold text-ink">{student.nome}</h3>
          <EvaluationBadges student={student} />
        </div>
      </div>

      <EvaluationActionButton
        disabled={disabled}
        isEnviada={isEnviada}
        isRascunho={isRascunho}
        evaluationUrl={evaluationUrl}
      />
    </div>
  );
}
