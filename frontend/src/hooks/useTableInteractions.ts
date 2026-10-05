import { useState } from 'react';
import { dropTargetAt, type DragPoint } from '@/hooks/usePointerGesture';
import { OFF_TABLE_DROP, seatFromDropId, type DragHandlers } from '@/pages/roll-call/dragHandlers';
import {
  seatStudent,
  studentAtSeat,
  unseatStudent,
  type RollCallBoard,
} from '@/utils/rollCallBoard';

type BoardChange = (update: (board: RollCallBoard) => RollCallBoard) => void;

export type TableDrag = { studentId: string; point: DragPoint; target: string | null };

function useTableDrag(change: BoardChange, clearSelection: () => void) {
  const [drag, setDrag] = useState<TableDrag | null>(null);

  const handlers: DragHandlers = {
    onDragStart: (studentId, point) => {
      clearSelection();
      setDrag({ studentId, point, target: dropTargetAt(point) });
    },
    onDragMove: (point) =>
      setDrag((current) => current && { ...current, point, target: dropTargetAt(point) }),
    onDrop: (studentId, target) => {
      setDrag(null);
      const seat = seatFromDropId(target);
      if (seat !== null) change((board) => seatStudent(board, studentId, seat));
      else if (target === OFF_TABLE_DROP) change((board) => unseatStudent(board, studentId));
    },
  };

  return { drag, handlers };
}

export function useTableInteractions(board: RollCallBoard | null, change: BoardChange) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelId, setPanelId] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<string | null>(null);
  const { drag, handlers } = useTableDrag(change, () => setSelectedId(null));

  function tapSeat(seat: number) {
    if (selectedId) {
      change((current) => seatStudent(current, selectedId, seat));
      setSelectedId(null);
      return;
    }
    const occupant = board ? studentAtSeat(board, seat) : undefined;
    if (occupant) setPanelId(occupant.alunoId);
  }

  return {
    selectedId,
    drag,
    dragHandlers: handlers,
    panelId,
    roleId,
    tapSeat,
    tapChip: (id: string) => setSelectedId((current) => (current === id ? null : id)),
    longPressChip: (id: string) => {
      setSelectedId(null);
      setPanelId(id);
    },
    closePanel: () => setPanelId(null),
    openRole: () => {
      setRoleId(panelId);
      setPanelId(null);
    },
    closeRole: () => setRoleId(null),
  };
}
