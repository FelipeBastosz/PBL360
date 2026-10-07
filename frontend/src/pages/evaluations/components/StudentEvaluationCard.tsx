import { Link } from 'react-router-dom';
import type { SessionEvaluationSummary } from '@/types/evaluation';
import { UserAvatar } from '@/components/ui/UserAvatar';

type StudentCardProps = {
  student: SessionEvaluationSummary;
  evaluationUrl: string;
  disabled?: boolean;
};

export function StudentEvaluationCard({ student, evaluationUrl, disabled }: StudentCardProps) {
  const isEnviada = student.status === 'ENVIADA';
  const isRascunho = student.status === 'RASCUNHO';
  const isPendente = student.status === 'PENDENTE';

  return (
    <div className="flex items-center justify-between gap-3 rounded-[20px] border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar
          user={{
            id: student.alunoId,
            nome: student.nome,
            possuiFoto: true,
          }}
          className="size-11 bg-brand-700 text-white"
        />

        <div className="flex flex-col min-w-0">
          <h3 className="truncate text-base font-bold text-ink">{student.nome}</h3>

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
              <span className="inline-flex items-center rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-900 border border-brand-200">
                Rascunho
              </span>
            )}

            {isEnviada && (
              <span className="inline-flex items-center rounded-md bg-success-soft px-2 py-0.5 text-xs font-semibold text-success border border-success/30">
                Enviada {student.notaSessao !== null && `· ${student.notaSessao.toFixed(1)}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {disabled ? (
        <button
          type="button"
          disabled
          className="w-24 shrink-0 rounded-[10px] bg-brand-900/40 py-2 text-center text-sm font-semibold text-white cursor-not-allowed"
        >
          Avaliar
        </button>
      ) : (
        <Link
          to={evaluationUrl}
          state={{ studentName: student.nome }}
          className={`w-24 shrink-0 rounded-[10px] py-2 text-center text-sm font-semibold transition ${
            isEnviada
              ? 'border border-brand-900 text-brand-900 bg-white hover:bg-brand-50'
              : 'bg-brand-900 text-white hover:bg-brand-800'
          }`}
        >
          {isEnviada ? 'Editar' : isRascunho ? 'Continuar' : 'Avaliar'}
        </Link>
      )}
    </div>
  );
}
