import type { DragPoint } from '@/hooks/usePointerGesture';
import type { RollCallStudent } from '@/types/session';
import { StudentAvatar } from './StudentAvatar';

export function DragGhost({ student, point }: { student: RollCallStudent; point: DragPoint }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2"
      style={{ left: point.x, top: point.y }}
    >
      <StudentAvatar
        student={student}
        className="size-16 scale-110 text-lg opacity-90 shadow-[0_16px_32px_-12px_rgb(0_0_119/0.7)] ring-4 ring-white"
      />
    </div>
  );
}
