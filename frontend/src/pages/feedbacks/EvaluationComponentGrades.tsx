import { formatGrade } from '@/utils/formatGrade';
import type { ReceivedSessionComponents } from '@/types/feedback';

function resolveActive(avaliacoes: ReceivedSessionComponents) {
  if (avaliacoes.modalidade === 'AUTOAVALIACAO') {
    return { label: 'Autoavaliação', grade: avaliacoes.autoavaliacao };
  }
  const isPoker = avaliacoes.pares?.origem === 'PLANNING_POKER';
  return { label: isPoker ? 'Planning Poker' : 'Avaliação de pares', grade: avaliacoes.pares };
}

export function EvaluationComponentGrades({
  avaliacoes,
}: {
  avaliacoes?: ReceivedSessionComponents;
}) {
  if (!avaliacoes) return null;
  const { label, grade } = resolveActive(avaliacoes);
  if (typeof grade?.nota !== 'number' || !Number.isFinite(grade.nota)) return null;

  return (
    <p
      data-testid="feedback-modalidade"
      className="w-fit rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-xs font-medium text-ink"
    >
      {label}: <strong>{formatGrade(grade.nota)}</strong>
    </p>
  );
}
