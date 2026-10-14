import { UserMinusIcon } from '@heroicons/react/24/outline';
import { Sheet } from '@/components/ui/Sheet';
import type { PokerCompleted, PokerStudent } from '@/types/planningPoker';
import { formatPokerGrade, joinNames } from '@/utils/pokerFormat';
import { StudentAvatar } from '../roll-call/StudentAvatar';

type ProgressSheetProps = {
  isOpen: boolean;
  total: number;
  completed: PokerCompleted[];
  pending: PokerStudent[];
  votingId: string | null;
  absentees: PokerStudent[];
  onClose: () => void;
};

function DoneRow({ item }: { item: PokerCompleted }) {
  return (
    <div className="flex items-center gap-3 border-b border-black/5 py-2.5">
      <StudentAvatar student={item} className="size-9 text-[13px]" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-semibold text-ink">{item.nome}</span>
        <span className="text-xs text-muted">
          {item.ajustada ? `Média dos votos ${formatPokerGrade(item.media)}` : 'Média aceita'}
        </span>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-lg font-bold text-brand-900">{formatPokerGrade(item.notaFinal)}</span>
        {item.ajustada && (
          <span className="rounded-full border border-brand-200 bg-brand-100 px-1.5 text-[10px] leading-4 font-semibold text-brand-900">
            Reajustada
          </span>
        )}
      </div>
    </div>
  );
}

function PendingRow({ student, isVoting }: { student: PokerStudent; isVoting: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-black/5 py-2">
      <StudentAvatar student={student} className="size-8 text-xs opacity-50" />
      <span className="min-w-0 flex-1 truncate text-sm text-ink">{student.nome}</span>
      <span className="rounded-md bg-black/5 px-2 py-0.5 text-xs font-semibold text-muted">
        {isVoting ? 'Em votação' : 'Pendente'}
      </span>
    </div>
  );
}

function EmptyDone() {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-black/15 px-3 py-5 text-center">
      <span className="text-[15px] font-semibold text-ink">Nenhum aluno avaliado ainda</span>
      <span className="text-[13px] leading-normal text-muted">
        As notas aparecem aqui quando você aceitar ou reajustar uma rodada.
      </span>
    </div>
  );
}

function absenteesNote(absentees: PokerStudent[]): string {
  const names = joinNames(absentees.map((student) => student.nome));
  return absentees.length === 1
    ? `${names} faltou e não entra no planning poker.`
    : `${names} faltaram e não entram no planning poker.`;
}

export function ProgressSheet(props: ProgressSheetProps) {
  return (
    <Sheet
      isOpen={props.isOpen}
      title="Progresso"
      description={`${props.completed.length} de ${props.total} avaliados`}
      onClose={props.onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-brand-900">Avaliados</span>
          {props.completed.length === 0 ? (
            <EmptyDone />
          ) : (
            props.completed.map((item) => <DoneRow key={item.alunoId} item={item} />)
          )}
        </div>
        {props.pending.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-brand-900">
              Faltam ({props.pending.length})
            </span>
            {props.pending.map((student) => (
              <PendingRow
                key={student.alunoId}
                student={student}
                isVoting={student.alunoId === props.votingId}
              />
            ))}
          </div>
        )}
        {props.absentees.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <UserMinusIcon className="size-4 shrink-0" aria-hidden />
            {absenteesNote(props.absentees)}
          </div>
        )}
      </div>
    </Sheet>
  );
}
