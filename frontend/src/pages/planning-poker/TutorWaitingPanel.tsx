import { CheckCircleIcon, CursorArrowRaysIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import type { PokerOrder, PokerStudent } from '@/types/planningPoker';
import { firstName } from '@/utils/pokerFormat';
import { StudentAvatar } from '../roll-call/StudentAvatar';
import { PokerCard, StudentPill, TextLink } from './PokerCard';

type TutorWaitingPanelProps = {
  order: PokerOrder;
  queue: PokerStudent[];
  doneCount: number;
  total: number;
  isBusy: boolean;
  onNext: () => void;
  onChoose: (studentId: string) => void;
  onEditQueue: () => void;
  onEnd: () => void;
};

function Counter({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-black/10 bg-white px-1 py-2">
      <span className={`text-2xl leading-none font-bold ${tone}`}>{value}</span>
      <span className="mt-1 text-[11px] text-muted">{label}</span>
    </div>
  );
}

function NextStudentCard({
  queue,
  round,
  total,
  onEditQueue,
}: Pick<TutorWaitingPanelProps, 'queue' | 'total' | 'onEditQueue'> & { round: number }) {
  const [next, ...rest] = queue;
  if (!next) return null;
  return (
    <PokerCard>
      <span className="text-[13px] text-muted">Próximo aluno</span>
      <div className="flex items-center gap-3">
        <StudentAvatar student={next} className="size-11" />
        <div className="flex min-w-0 flex-col">
          <span className="text-base font-semibold text-ink">{next.nome}</span>
          <span className="text-[13px] text-muted">
            Rodada {round} de {total}
          </span>
        </div>
      </div>
      {rest.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-black/5 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-muted">Na fila</span>
            <button
              type="button"
              onClick={onEditQueue}
              className="text-sm font-medium text-brand-900 underline underline-offset-4"
            >
              Editar fila
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {rest.map((student) => (
              <StudentPill key={student.alunoId} student={student} />
            ))}
          </div>
        </div>
      )}
    </PokerCard>
  );
}

function ChooseStudent({ queue, onChoose }: Pick<TutorWaitingPanelProps, 'queue' | 'onChoose'>) {
  return (
    <>
      <div
        role="status"
        className="flex items-start gap-2 rounded-[10px] border border-brand-300/40 bg-brand-50 p-3 text-sm text-brand-900"
      >
        <CursorArrowRaysIcon className="mt-px size-5 shrink-0" aria-hidden />
        <div className="flex-1">
          <strong className="font-semibold">Toque em um aluno para avaliá-lo</strong>
          <br />
          Na mesa ou na lista abaixo.
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {queue.map((student) => (
          <button
            key={student.alunoId}
            type="button"
            onClick={() => onChoose(student.alunoId)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-brand-900/15 bg-white py-1 pr-3 pl-1 text-sm font-medium text-ink shadow-[0_8px_20px_-14px_rgb(0_0_119/0.45)]"
          >
            <StudentAvatar student={student} className="size-8 text-xs" />
            {firstName(student.nome)}
          </button>
        ))}
      </div>
    </>
  );
}

export function TutorWaitingPanel(props: TutorWaitingPanelProps) {
  const allDone = props.queue.length === 0;
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Counter value={props.doneCount} label="Avaliados" tone="text-success" />
        <Counter value={props.queue.length} label="Faltam" tone="text-brand-900" />
      </div>
      {!allDone && props.order === 'SEQUENCIAL' && (
        <>
          <NextStudentCard {...props} round={props.doneCount + 1} />
          <Button onClick={props.onNext} isLoading={props.isBusy}>
            Próximo aluno
          </Button>
        </>
      )}
      {!allDone && props.order === 'MANUAL' && <ChooseStudent {...props} />}
      {allDone && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-[10px] border border-success/30 bg-success-soft p-3 text-sm text-success"
        >
          <CheckCircleIcon className="size-5 shrink-0" aria-hidden />
          <div className="flex-1">Todos os alunos presentes foram avaliados.</div>
        </div>
      )}
      <TextLink tone="danger" onClick={props.onEnd}>
        Encerrar planning poker
      </TextLink>
    </>
  );
}
