import type { DragPoint } from '@/hooks/usePointerGesture';

export type DragHandlers = {
  onDragStart: (studentId: string, point: DragPoint) => void;
  onDragMove: (point: DragPoint) => void;
  onDrop: (studentId: string, target: string | null) => void;
};

export const OFF_TABLE_DROP = 'carometro';

export const seatDropId = (seat: number) => `seat-${seat}`;

export function seatFromDropId(dropId: string | null): number | null {
  const match = dropId?.match(/^seat-(\d+)$/);
  return match ? Number(match[1]) : null;
}
