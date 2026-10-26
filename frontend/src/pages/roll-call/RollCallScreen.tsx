import { Button } from '@/components/ui/Button';
import { useSessionRoles } from '@/hooks/useSessionRoles';
import { useTableInteractions } from '@/hooks/useTableInteractions';
import { useToast } from '@/hooks/useToast';
import type { useRollCall } from '@/hooks/useRollCall';
import type { RollCall } from '@/types/session';
import {
  countTotals,
  freeSeats,
  isOffTable,
  markRemainingAbsent,
  seatEveryone,
  type RollCallBoard,
} from '@/utils/rollCallBoard';
import { roleBadge } from '@/utils/sessionRoles';
import { AttendanceCounters } from './AttendanceCounters';
import { DragGhost } from './DragGhost';
import { OffTablePanel } from './OffTablePanel';
import { PrefillNotice } from './PrefillNotice';
import { RollCallPanels } from './RollCallPanels';
import { TutorialTable } from './TutorialTable';
import { OFF_TABLE_DROP } from './dragHandlers';

type RollCallScreenProps = Omit<ReturnType<typeof useRollCall>, 'rollCall' | 'board'> & {
  sessionId: string;
  rollCall: RollCall;
  board: RollCallBoard;
};

function SaveBar({
  isDirty,
  isSaving,
  onSave,
}: {
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="sticky bottom-0 -mx-4 bg-linear-to-t from-surface from-60% px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:static lg:mx-0 lg:bg-none lg:p-0">
      <Button onClick={onSave} disabled={!isDirty} isLoading={isSaving}>
        Salvar chamada
      </Button>
      {isDirty && (
        <p className="mt-2 text-center text-xs text-muted animate-fade-in">
          Há alterações não salvas.
        </p>
      )}
    </div>
  );
}

type SectionProps = {
  board: RollCallBoard;
  change: RollCallScreenProps['change'];
  table: ReturnType<typeof useTableInteractions>;
};

function TableSection({
  board,
  table,
  rollCall,
  roles,
}: SectionProps & { rollCall: RollCall; roles: ReturnType<typeof useSessionRoles> }) {
  const reference = rollCall.origem === 'SESSAO_ANTERIOR' ? rollCall.sessaoReferencia : null;

  return (
    <section className="flex flex-col gap-3" aria-label="Chamada na mesa">
      <AttendanceCounters totals={countTotals(board)} />
      {reference && <PrefillNotice date={reference.data} />}
      <TutorialTable
        seats={board.seats}
        students={board.students}
        roleBadgeOf={(id) => {
          const role = roles.roleOf(id);
          return role ? roleBadge(role.papel) : null;
        }}
        isPlacing={Boolean(table.selectedId)}
        hoveredDrop={table.drag?.target ?? null}
        draggingId={table.drag?.studentId ?? null}
        onSeatTap={table.tapSeat}
        drag={table.dragHandlers}
      />
    </section>
  );
}

function CarometroSection({ board, change, table }: SectionProps) {
  const offTable = board.students.filter(isOffTable);
  const seatable = offTable.some((s) => s.status !== 'JUSTIFICADO' && s.status !== 'AUSENTE');

  return (
    <OffTablePanel
      students={offTable}
      selectedId={table.selectedId}
      draggingId={table.drag?.studentId ?? null}
      isDropTarget={table.drag?.target === OFF_TABLE_DROP}
      canSeatEveryone={freeSeats(board).length > 0 && seatable}
      canMarkAbsent={offTable.some((student) => student.status === null)}
      onTap={table.tapChip}
      onLongPress={table.longPressChip}
      onSeatEveryone={() => change(seatEveryone)}
      onMarkAbsent={() => change(markRemainingAbsent)}
      drag={table.dragHandlers}
    />
  );
}

export function RollCallScreen({
  sessionId,
  rollCall,
  board,
  change,
  isDirty,
  persist,
  isSaving,
}: RollCallScreenProps) {
  const { notify } = useToast();
  const roles = useSessionRoles(sessionId);
  const table = useTableInteractions(board, change);
  const dragged = board.students.find((student) => student.alunoId === table.drag?.studentId);

  async function save() {
    const result = await persist();
    if (result?.ok) {
      notify({ tone: 'success', message: 'Chamada salva.' });
      void roles.reload();
    } else if (result) notify({ tone: 'error', message: result.error.message });
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:pt-8 lg:pb-10">
      <TableSection board={board} change={change} table={table} rollCall={rollCall} roles={roles} />
      <aside className="mt-4 flex flex-col gap-4 lg:sticky lg:top-28 lg:mt-0 lg:self-start">
        <CarometroSection board={board} change={change} table={table} />
        <SaveBar isDirty={isDirty} isSaving={isSaving} onSave={() => void save()} />
      </aside>
      {dragged && table.drag && <DragGhost student={dragged} point={table.drag.point} />}
      <RollCallPanels board={board} change={change} table={table} roles={roles} />
    </main>
  );
}
