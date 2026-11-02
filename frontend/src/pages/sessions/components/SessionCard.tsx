import { Link } from 'react-router-dom';
import { CalendarIcon } from '@heroicons/react/24/outline';
import type { Session } from '@/types/session';
import { formatDayShortMonth } from '@/utils/date';

type ExtendedSession = Session & {
  avaliacoesLiberadas?: boolean;
  liberada?: boolean;
  selfEvalReleased?: boolean;
  peerEvalReleased?: boolean;
  autoavaliacaoLiberada?: boolean;
  avaliacaoEntreParesLiberada?: boolean;
  self_eval_released?: boolean;
  peer_eval_released?: boolean;
};

type SessionCardProps = {
  session: ExtendedSession;
  roomId: string;
  problemId: string;
};

export function SessionCard({ session, roomId, problemId }: SessionCardProps) {
  const isReleased = Boolean(
    session.avaliacoesLiberadas ||
    session.liberada ||
    session.selfEvalReleased ||
    session.peerEvalReleased ||
    session.autoavaliacaoLiberada ||
    session.avaliacaoEntreParesLiberada ||
    session.self_eval_released ||
    session.peer_eval_released ||
    session.status === 'liberada',
  );

  return (
    <Link
      to={`/turmas/${roomId}/problemas/${problemId}/sessoes/${session.id}`}
      className="flex items-center justify-between gap-4 rounded-[20px] border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-900"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
          <CalendarIcon className="size-6" />
        </div>

        <div className="flex flex-col min-w-0">
          <h3 className="truncate text-base font-bold text-ink">
            {session.titulo} · {formatDayShortMonth(session.data)}
          </h3>
          <p className="truncate text-xs text-muted">{session.descricao || 'Sem descrição'}</p>
        </div>
      </div>

      {isReleased && (
        <span className="shrink-0 rounded-md border border-success/30 bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
          Avaliações liberadas
        </span>
      )}
    </Link>
  );
}
