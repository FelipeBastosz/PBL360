import type { RollCallStudent } from '@/types/session';
import { seatPositions } from '@/utils/seatLayout';
import type { DragHandlers } from './dragHandlers';
import { seatDropId } from './dragHandlers';
import { Seat } from './Seat';

type TutorialTableProps = {
  seats: number;
  students: RollCallStudent[];
  roleBadgeOf: (studentId: string) => string | null;
  isPlacing: boolean;
  hoveredDrop: string | null;
  draggingId: string | null;
  onSeatTap: (seat: number) => void;
  drag: DragHandlers;
};

export function TutorialTable({
  seats,
  students,
  roleBadgeOf,
  isPlacing,
  hoveredDrop,
  draggingId,
  onSeatTap,
  drag,
}: TutorialTableProps) {
  const bySeat = new Map(students.filter((s) => s.lugar !== null).map((s) => [s.lugar, s]));

  return (
    <div
      className="relative mx-auto aspect-[3/5] w-full max-w-[400px] animate-fade-in"
      aria-label="Mesa tutorial"
      role="group"
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute top-[16%] left-[22%] h-[68%] w-[56%] overflow-visible"
        aria-hidden
      >
        <polygon
          points="50,0 100,22 100,78 50,100 0,78 0,22"
          className="fill-brand-50 stroke-brand-900"
          strokeWidth="0.6"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {seatPositions(seats).map((position) => {
        const student = bySeat.get(position.seat);
        return (
          <Seat
            key={position.seat}
            position={position}
            student={student}
            roleBadge={student ? roleBadgeOf(student.alunoId) : null}
            isTarget={isPlacing}
            isHovered={hoveredDrop === seatDropId(position.seat)}
            isDragging={Boolean(student && student.alunoId === draggingId)}
            onTap={onSeatTap}
            drag={drag}
          />
        );
      })}
    </div>
  );
}
