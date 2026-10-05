import { ClockIcon, PlusIcon } from '@heroicons/react/24/outline';
import { usePointerGesture } from '@/hooks/usePointerGesture';
import type { RollCallStudent } from '@/types/session';
import { cn } from '@/utils/cn';
import type { SeatPosition } from '@/utils/seatLayout';
import { STATUS_LABEL } from './attendanceLabels';
import { seatDropId, type DragHandlers } from './dragHandlers';
import { StudentAvatar } from './StudentAvatar';

type SeatProps = {
  position: SeatPosition;
  student?: RollCallStudent;
  roleBadge?: string | null;
  isTarget: boolean;
  isHovered: boolean;
  isDragging: boolean;
  onTap: (seat: number) => void;
  drag: DragHandlers;
};

function seatLabel(seat: number, student?: RollCallStudent) {
  if (!student) return `Lugar ${seat}, livre`;
  return `Lugar ${seat}: ${student.nome}${student.status ? `, ${STATUS_LABEL[student.status]}` : ''}`;
}

function OccupiedSeat({
  student,
  roleBadge,
}: {
  student: RollCallStudent;
  roleBadge?: string | null;
}) {
  return (
    <>
      <StudentAvatar
        student={student}
        className={cn(
          'size-full text-base ring-[3px]',
          student.status === 'ATRASADO' ? 'ring-warning-line' : 'ring-white',
        )}
      />
      {student.status === 'ATRASADO' && (
        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-warning text-white ring-2 ring-surface">
          <ClockIcon className="size-3.5" strokeWidth={2.5} aria-hidden />
        </span>
      )}
      {roleBadge && (
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-warning-line bg-warning-soft px-1.5 text-[0.625rem] leading-4 font-semibold whitespace-nowrap text-warning animate-pop-in">
          {roleBadge}
        </span>
      )}
    </>
  );
}

export function Seat({
  position,
  student,
  roleBadge,
  isTarget,
  isHovered,
  isDragging,
  onTap,
  drag,
}: SeatProps) {
  const gesture = usePointerGesture({
    onDragStart: (point) => student && drag.onDragStart(student.alunoId, point),
    onDragMove: drag.onDragMove,
    onDrop: student ? (target) => drag.onDrop(student.alunoId, target) : undefined,
  });

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${position.left}%`, top: `${position.top}%` }}
    >
      <button
        type="button"
        data-drop={seatDropId(position.seat)}
        aria-label={seatLabel(position.seat, student)}
        onClick={() => onTap(position.seat)}
        {...(student ? gesture : {})}
        className={cn(
          'relative flex size-14 touch-none items-center justify-center rounded-full transition-[scale,box-shadow,background-color,opacity] duration-200 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-900 sm:size-16',
          student
            ? 'shadow-[0_6px_16px_-8px_rgb(0_0_119/0.6)]'
            : 'border-2 border-brand-900/70 bg-brand-50 text-placeholder hover:bg-brand-100',
          isTarget && !student && 'shadow-[0_0_0_5px_rgb(158_158_255/0.45)]',
          isHovered && 'scale-110 shadow-[0_0_0_5px_rgb(0_0_119/0.25)]',
          isDragging && 'opacity-30',
        )}
      >
        {student ? (
          <OccupiedSeat student={student} roleBadge={roleBadge} />
        ) : (
          <PlusIcon className="size-6" aria-hidden />
        )}
      </button>
    </div>
  );
}
