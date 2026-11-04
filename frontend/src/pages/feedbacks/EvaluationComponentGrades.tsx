import { formatGrade } from '@/utils/formatGrade';
import type { ReceivedComponentGrade, ReceivedSessionComponents } from '@/types/feedback';

function hasGrade(
  grade: ReceivedComponentGrade | null | undefined,
): grade is ReceivedComponentGrade {
  return Boolean(grade) && typeof grade?.nota === 'number' && Number.isFinite(grade.nota);
}

function peerLabel(grade: ReceivedComponentGrade) {
  return grade.origem === 'PLANNING_POKER' ? 'Planning Poker' : 'Avaliação de pares';
}

export function EvaluationComponentGrades({
  avaliacoes,
}: {
  avaliacoes?: ReceivedSessionComponents;
}) {
  const items = [
    hasGrade(avaliacoes?.autoavaliacao)
      ? { key: 'self', label: 'Autoavaliação', nota: avaliacoes.autoavaliacao.nota }
      : null,
    hasGrade(avaliacoes?.pares)
      ? { key: 'peer', label: peerLabel(avaliacoes.pares), nota: avaliacoes.pares.nota }
      : null,
  ].filter((item) => item !== null);

  if (items.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Notas da sessão">
      {items.map((item) => (
        <li
          key={item.key}
          data-testid={`feedback-nota-${item.key}`}
          className="rounded-lg border border-black/5 bg-surface px-2.5 py-1 text-xs font-medium text-ink"
        >
          {item.label}: <strong>{formatGrade(item.nota as number)}</strong>
        </li>
      ))}
    </ul>
  );
}
