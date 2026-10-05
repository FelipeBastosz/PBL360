import { usePointerGesture } from '@/hooks/usePointerGesture';
import type { RollCallStudent } from '@/types/session';
import { cn } from '@/utils/cn';
import { STATUS_LABEL, STATUS_TEXT_CLASS } from './attendanceLabels';
import type { DragHandlers } from './dragHandlers';
import { StudentAvatar } from './StudentAvatar';

type StudentChipProps = {
  student: RollCallStudent;
  isSelected: boolean;
  isDragging: boolean;
  onTap: (studentId: string) => void;
  onLongPress: (studentId: string) => void;
  drag: DragHandlers;
};

function ChipStatus({ student }: { student: RollCallStudent }) {
  if (!student.status) return null;
  return (
    <span
      className={cn(
        'text-[0.625rem] leading-none font-semibold',
        STATUS_TEXT_CLASS[student.status],
      )}
    >
      {STATUS_LABEL[student.status]}
    </span>
  );
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export function StudentChip({
  student,
  isSelected,
  isDragging,
  onTap,
  onLongPress,
  drag,
}: StudentChipProps) {
  const gesture = usePointerGesture({
    onLongPress: () => onLongPress(student.alunoId),
    onDragStart: (point) => drag.onDragStart(student.alunoId, point),
    onDragMove: drag.onDragMove,
    onDrop: (target) => drag.onDrop(student.alunoId, target),
  });
  const statusLabel = student.status ? STATUS_LABEL[student.status] : null;

  return (
    <li className="flex justify-center">
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={`${student.nome}, fora da mesa${statusLabel ? `, ${statusLabel}` : ''}`}
        onClick={() => onTap(student.alunoId)}
        {...gesture}
        className={cn(
          'flex w-full touch-none flex-col items-center gap-1 rounded-2xl p-1.5 transition-[scale,background-color,opacity] duration-200 select-none [-webkit-touch-callout:none] active:scale-95 focus-visible:outline-2 focus-visible:outline-brand-900',
          isSelected && 'scale-105 bg-brand-50',
          isDragging && 'opacity-30',
        )}
      >
        <StudentAvatar
          student={student}
          className={cn(
            'size-14 text-base transition-shadow duration-200',
            isSelected && 'shadow-[0_0_0_4px_rgb(0_0_119/0.35)]',
            (student.status === 'JUSTIFICADO' || student.status === 'AUSENTE') &&
              'opacity-60 grayscale',
          )}
        />
        <span className="w-full truncate text-center text-xs text-ink">
          {firstName(student.nome)}
        </span>
        <ChipStatus student={student} />
      </button>
    </li>
  );
}
