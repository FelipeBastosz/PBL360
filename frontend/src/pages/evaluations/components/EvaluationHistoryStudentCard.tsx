import { ClockIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { StudentEvaluationHistoryItem } from '@/types/evaluation';
import { formatGrade } from '@/utils/gradeFormatters';
import { getInitials } from '@/utils/initials';
import { cn } from '@/utils/cn';

type StudentCardProps = {
  student: StudentEvaluationHistoryItem;
  hideNames?: boolean;
  onSelect: (student: StudentEvaluationHistoryItem) => void;
};

const AVATAR_BG_COLORS = [
  'bg-blue-600',
  'bg-teal-600',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-cyan-600',
  'bg-blue-700',
];

function getAvatarBg(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i)) % AVATAR_BG_COLORS.length;
  }
  return AVATAR_BG_COLORS[hash] ?? 'bg-blue-600';
}

function CardStatus({ isAdjusted }: { isAdjusted: boolean }) {
  if (isAdjusted) {
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
        <CheckIcon className="size-3.5 stroke-[2.5]" aria-hidden="true" />
        <span>Ajustada com justificativa</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted">
      <ClockIcon className="size-3.5" aria-hidden="true" />
      <span>Sem ajuste do tutor</span>
    </div>
  );
}

function ComparisonScores({
  isAdjusted,
  originalGrade,
  currentGrade,
}: {
  isAdjusted: boolean;
  originalGrade: number | null;
  currentGrade: number | null;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Aluno</span>
        <span className="text-sm font-bold text-ink">
          {formatGrade(originalGrade ?? currentGrade)}
        </span>
      </div>
      <span className="text-xs text-muted font-light" aria-hidden="true">
        →
      </span>
      <div className="flex flex-col items-center">
        <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Tutor</span>
        {isAdjusted ? (
          <span className="text-sm font-bold text-blue-600">{formatGrade(currentGrade)}</span>
        ) : (
          <span className="text-sm font-medium text-muted">—</span>
        )}
      </div>
    </div>
  );
}

export function EvaluationHistoryStudentCard({
  student,
  hideNames = false,
  onSelect,
}: StudentCardProps) {
  const isAdjusted = student.situacaoAjuste === 'AJUSTADA';
  const displayName = hideNames ? student.matricula || 'Sem matrícula' : student.nome;
  const initials = getInitials(student.nome);
  const avatarBg = getAvatarBg(student.alunoId);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(student)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(student)}
      aria-label={`Ajustar autoavaliação de ${displayName}`}
      className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-xs transition hover:border-brand-200 hover:shadow-sm active:scale-[0.99] cursor-pointer"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-2xs',
            avatarBg,
          )}
        >
          {initials}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-bold text-ink">{displayName}</span>
          <CardStatus isAdjusted={isAdjusted} />
        </div>
      </div>

      <ComparisonScores
        isAdjusted={isAdjusted}
        originalGrade={student.notaAlunoOriginal}
        currentGrade={student.notaAluno}
      />
    </div>
  );
}
