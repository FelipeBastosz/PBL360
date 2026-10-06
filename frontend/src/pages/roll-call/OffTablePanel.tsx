import type { RollCallStudent } from '@/types/session';
import { cn } from '@/utils/cn';
import { countLabel } from '@/utils/countLabel';
import { OFF_TABLE_DROP, type DragHandlers } from './dragHandlers';
import { StudentChip } from './StudentChip';

type OffTablePanelProps = {
  students: RollCallStudent[];
  selectedId: string | null;
  draggingId: string | null;
  isDropTarget: boolean;
  canSeatEveryone: boolean;
  canMarkAbsent: boolean;
  onTap: (studentId: string) => void;
  onLongPress: (studentId: string) => void;
  onSeatEveryone: () => void;
  onMarkAbsent: () => void;
  drag: DragHandlers;
};

function PanelHint({ selected }: { selected?: RollCallStudent }) {
  if (selected) {
    return (
      <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-900 animate-slide-down">
        Toque em um lugar da mesa para sentar {selected.nome}.
      </p>
    );
  }
  return (
    <p className="text-sm text-muted">
      Arraste a foto até um lugar, ou toque na foto e depois no lugar. Tocar em quem já está na mesa
      abre presença e papel. Pressione a foto para marcar falta.
    </p>
  );
}

const BATCH_BUTTON =
  'h-11 flex-1 rounded-xl border text-sm font-semibold transition-[background-color,scale] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2';

type BatchActionsProps = Pick<
  OffTablePanelProps,
  'canSeatEveryone' | 'canMarkAbsent' | 'onSeatEveryone' | 'onMarkAbsent'
>;

function BatchActions({
  canSeatEveryone,
  canMarkAbsent,
  onSeatEveryone,
  onMarkAbsent,
}: BatchActionsProps) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onSeatEveryone}
        disabled={!canSeatEveryone}
        className={cn(
          BATCH_BUTTON,
          'border-brand-900 text-brand-900 hover:bg-brand-50 focus-visible:outline-brand-900',
        )}
      >
        Sentar todos
      </button>
      <button
        type="button"
        onClick={onMarkAbsent}
        disabled={!canMarkAbsent}
        className={cn(
          BATCH_BUTTON,
          'border-danger text-danger hover:bg-danger-soft focus-visible:outline-danger',
        )}
      >
        Restantes ausentes
      </button>
    </div>
  );
}

function ChipGrid({
  students,
  selectedId,
  draggingId,
  onTap,
  onLongPress,
  drag,
}: OffTablePanelProps) {
  return (
    <ul className="stagger-in grid grid-cols-4 gap-1">
      {students.map((student) => (
        <StudentChip
          key={student.alunoId}
          student={student}
          isSelected={student.alunoId === selectedId}
          isDragging={student.alunoId === draggingId}
          onTap={onTap}
          onLongPress={onLongPress}
          drag={drag}
        />
      ))}
    </ul>
  );
}

export function OffTablePanel(props: OffTablePanelProps) {
  const { students, selectedId, isDropTarget } = props;
  const selected = students.find((student) => student.alunoId === selectedId);

  return (
    <section
      data-drop={OFF_TABLE_DROP}
      aria-labelledby="carometro-title"
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-[0_8px_24px_-16px_rgb(16_33_76/0.35)] transition-shadow duration-200',
        isDropTarget && 'shadow-[0_0_0_3px_rgb(0_0_119/0.3)]',
      )}
    >
      <header className="flex items-baseline justify-between gap-2">
        <h2 id="carometro-title" className="font-semibold text-ink">
          Carômetro — fora da mesa
        </h2>
        <span className="shrink-0 text-sm text-muted">
          {countLabel(students.length, 'aluno', 'alunos')}
        </span>
      </header>
      <PanelHint selected={selected} />
      {students.length ? (
        <ChipGrid {...props} />
      ) : (
        <p className="py-2 text-center text-sm text-muted">Todos os alunos estão na mesa.</p>
      )}
      <BatchActions
        canSeatEveryone={props.canSeatEveryone}
        canMarkAbsent={props.canMarkAbsent}
        onSeatEveryone={props.onSeatEveryone}
        onMarkAbsent={props.onMarkAbsent}
      />
    </section>
  );
}
