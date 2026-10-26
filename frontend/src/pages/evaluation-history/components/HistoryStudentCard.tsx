import { UserAvatar } from '@/components/ui/UserAvatar';
import type { StudentEvaluationHistoryItem } from '@/types/evaluationHistory';
import { cn } from '@/utils/cn';
import {
  formatScore,
  getDisplayName,
  getSituationLabel,
  getStudentScore,
  getTutorScore,
  hasSubmitted,
} from '@/utils/evaluationHistory';

type HistoryStudentCardProps = {
  student: StudentEvaluationHistoryItem;
  hideNames: boolean;
  index: number;
  onSelect: (student: StudentEvaluationHistoryItem) => void;
};

// Fallback colours for students without a photo, in the order used by the layout.
const AVATAR_COLORS = [
  'bg-[#1E2BAA]!',
  'bg-[#00B8A9]!',
  'bg-[#00706A]!',
  'bg-[#4C5BEA]!',
  'bg-[#0E7C8C]!',
  'bg-[#2D3FE7]!',
];

// Icons drawn to the layout's exact strokes (heroicons are heavier at this size).
function CheckMark() {
  return (
    <svg viewBox="0 0 11 11" className="size-[11px] shrink-0" fill="none" aria-hidden>
      <path
        d="M1.01 5.94 2.78 7.71 7.2 3.29"
        stroke="currentColor"
        strokeWidth={1.15}
        strokeLinecap="round"
      />
    </svg>
  );
}

function PendingClock() {
  return (
    <svg viewBox="0 0 11 11" className="size-[11px] shrink-0" fill="none" aria-hidden>
      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth={1.3} />
      <path
        d="M5.5 3v2.5l1.5 1"
        stroke="currentColor"
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SituationLine({ student }: { student: StudentEvaluationHistoryItem }) {
  const isAdjusted = hasSubmitted(student) && student.situacaoAjuste === 'AJUSTADA';

  return (
    <p
      className={cn(
        'flex items-center text-[11.5px] leading-[14px]',
        isAdjusted ? 'gap-[3.3px] text-[#1E2BAA]' : 'gap-[5.5px] text-[#5C6072]',
      )}
    >
      {isAdjusted ? <CheckMark /> : <PendingClock />}
      <span>{getSituationLabel(student)}</span>
    </p>
  );
}

type ScoreColumnProps = { label: string; value: number | null; isTutor?: boolean };

function ScoreColumn({ label, value, isTutor }: ScoreColumnProps) {
  return (
    <div className="flex w-[35px] flex-col items-center">
      <span className="text-[9.5px] leading-3 font-medium tracking-[0.05em] text-[#5C6072] uppercase">
        {label}
      </span>
      {value === null ? (
        <span className="flex h-[18px] items-center" aria-label="Sem nota">
          <span className="h-[1.7px] w-4 bg-[#CBCFDC]" />
        </span>
      ) : (
        <span
          className={cn(
            'text-[16px] leading-[18px] font-semibold tabular-nums',
            isTutor ? 'text-[#1E2BAA]' : 'text-[#5C6072]',
          )}
        >
          {formatScore(value)}
        </span>
      )}
    </div>
  );
}

function ScoreArrow() {
  return (
    <svg viewBox="0 0 10 7" className="h-[7px] w-[10px] shrink-0" fill="none" aria-hidden>
      <path
        d="M1 3.5h8M6.33 6.17 9 3.5 6.33.83"
        stroke="#CBCFDC"
        strokeWidth={1.33}
        strokeLinecap="round"
      />
    </svg>
  );
}

type StudentPhotoProps = Omit<HistoryStudentCardProps, 'hideNames'> & { displayName: string };

// Only a submitted self-assessment can be adjusted, so only then the photo opens the sheet.
function StudentPhoto({ student, index, displayName, onSelect }: StudentPhotoProps) {
  const avatar = (
    <UserAvatar
      user={{ id: student.alunoId, nome: student.nome, possuiFoto: true }}
      className={cn(
        'size-10! text-[13px]! font-bold! text-white!',
        AVATAR_COLORS[index % AVATAR_COLORS.length],
      )}
    />
  );
  if (!hasSubmitted(student)) return avatar;

  return (
    <button
      type="button"
      onClick={() => onSelect(student)}
      aria-label={`Ajustar nota de ${displayName}`}
      className="shrink-0 rounded-full transition-[scale] duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900"
    >
      {avatar}
    </button>
  );
}

export function HistoryStudentCard({
  student,
  hideNames,
  index,
  onSelect,
}: HistoryStudentCardProps) {
  const displayName = getDisplayName(student, hideNames);

  return (
    <article className="flex items-center gap-3 rounded-xl border border-[#E2E4EC] bg-white p-[13.8px] shadow-[0_2px_8px_rgb(26_29_41/0.08)]">
      <StudentPhoto student={student} index={index} displayName={displayName} onSelect={onSelect} />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <h2 className="truncate text-[15px] leading-[18px] font-semibold text-brand-900">
          {displayName}
        </h2>
        <SituationLine student={student} />
      </div>
      <div className="flex shrink-0 items-center gap-[15.5px]">
        <ScoreColumn label="Aluno" value={getStudentScore(student)} />
        <ScoreArrow />
        <ScoreColumn label="Tutor" value={getTutorScore(student)} isTutor />
      </div>
    </article>
  );
}
