import type {
  HistoryAdjustment,
  HistoryPlanningPoker,
  StudentEvaluationHistoryDetail,
} from '@/types/evaluationHistory';
import { formatDateTime } from '@/utils/date';
import { formatScore } from '@/utils/evaluationHistory';

type HistoryDetailPanelProps = {
  detail: StudentEvaluationHistoryDetail | null;
  isLoading: boolean;
  failed: boolean;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-ink tabular-nums">{value}</dd>
    </div>
  );
}

function PokerSummary({ poker }: { poker: HistoryPlanningPoker }) {
  const votes = poker.votos.map((vote) => formatScore(vote.nota)).join(' · ');
  return (
    <section aria-label="Planning poker" className="flex flex-col gap-1.5">
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">Planning poker</h3>
      <dl className="flex flex-col gap-1">
        <DetailRow label="Média dos votos" value={formatScore(poker.media)} />
        <DetailRow label="Nota decidida na mesa" value={formatScore(poker.notaDecidida)} />
        <DetailRow label="Votos" value={votes || '—'} />
      </dl>
      {poker.ajustadaNaMesa && poker.justificativaMesa && (
        <p className="text-xs text-muted">Reajustada na mesa: {poker.justificativaMesa}</p>
      )}
    </section>
  );
}

function AdjustmentItem({ adjustment }: { adjustment: HistoryAdjustment }) {
  return (
    <li className="flex flex-col gap-0.5 border-b border-black/5 py-1.5 last:border-0">
      <span className="text-sm font-semibold text-ink tabular-nums">
        {formatScore(adjustment.valorAnterior)} → {formatScore(adjustment.valorNovo)}
      </span>
      <span className="text-xs text-muted">{adjustment.justificativa}</span>
      <span className="text-[11px] text-muted">
        {adjustment.autor.nome} · {formatDateTime(adjustment.ajustadoEm)}
      </span>
    </li>
  );
}

function AdjustmentList({ adjustments }: { adjustments: HistoryAdjustment[] }) {
  if (adjustments.length === 0) return null;
  return (
    <section aria-label="Ajustes anteriores" className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
        Ajustes anteriores
      </h3>
      <ul>
        {adjustments.map((adjustment) => (
          <AdjustmentItem
            key={`${adjustment.ajustadoEm}-${adjustment.valorNovo}`}
            adjustment={adjustment}
          />
        ))}
      </ul>
    </section>
  );
}

export function HistoryDetailPanel({ detail, isLoading, failed }: HistoryDetailPanelProps) {
  if (isLoading) return <p className="text-xs text-muted">Carregando histórico do aluno…</p>;
  if (failed) {
    return <p className="text-xs text-muted">Não foi possível carregar o histórico do aluno.</p>;
  }
  if (!detail || (!detail.planningPoker && detail.ajustes.length === 0)) return null;
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-gray-50/70 p-3.5">
      {detail.planningPoker && <PokerSummary poker={detail.planningPoker} />}
      <AdjustmentList adjustments={detail.ajustes} />
    </div>
  );
}
