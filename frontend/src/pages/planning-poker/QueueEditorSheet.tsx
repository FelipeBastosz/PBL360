import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import type { PokerStudent } from '@/types/planningPoker';
import { StudentAvatar } from '../roll-call/StudentAvatar';
import { TextLink } from './PokerCard';

type QueueEditorSheetProps = {
  queue: PokerStudent[];
  isBusy: boolean;
  onSave: (queue: string[]) => void;
  onClose: () => void;
};

const MOVE =
  'flex size-11 items-center justify-center rounded-xl border border-black/10 bg-white text-brand-900 disabled:opacity-30';

function move(list: PokerStudent[], index: number, delta: number): PokerStudent[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

type QueueRowProps = {
  student: PokerStudent;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: number) => void;
};

function QueueRow({ student, position, isFirst, isLast, onMove }: QueueRowProps) {
  return (
    <li className="flex items-center gap-3 border-b border-black/5 py-2">
      <span className="w-5 text-center text-sm font-semibold text-muted">{position}</span>
      <StudentAvatar student={student} className="size-9 text-[13px]" />
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
        {student.nome}
      </span>
      <button
        type="button"
        aria-label={`Subir ${student.nome}`}
        disabled={isFirst}
        onClick={() => onMove(-1)}
        className={MOVE}
      >
        <ChevronUpIcon className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label={`Descer ${student.nome}`}
        disabled={isLast}
        onClick={() => onMove(1)}
        className={MOVE}
      >
        <ChevronDownIcon className="size-5" aria-hidden />
      </button>
    </li>
  );
}

export function QueueEditorSheet({ queue, isBusy, onSave, onClose }: QueueEditorSheetProps) {
  const [order, setOrder] = useState(queue);

  return (
    <Sheet
      isOpen
      title="Editar fila"
      description="A ordem em que os alunos serão avaliados."
      onClose={onClose}
    >
      <ol className="flex flex-col">
        {order.map((student, index) => (
          <QueueRow
            key={student.alunoId}
            student={student}
            position={index + 1}
            isFirst={index === 0}
            isLast={index === order.length - 1}
            onMove={(delta) => setOrder((current) => move(current, index, delta))}
          />
        ))}
      </ol>
      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={() => onSave(order.map((student) => student.alunoId))} isLoading={isBusy}>
          Salvar fila
        </Button>
        <TextLink onClick={onClose}>Cancelar</TextLink>
      </div>
    </Sheet>
  );
}
