import { Link } from 'react-router-dom';
import { CalendarIcon } from '@heroicons/react/24/outline';
import type { Session } from '@/types/session';

type SessionCardProps = {
  session: Session;
  roomId: string;
  problemId: string;
};

function formatSessionDate(dateString: string) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit' });
  const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${dayStr} ${monthStr}`;
}

export function SessionCard({ session, roomId, problemId }: SessionCardProps) {
  return (
    <Link
      to={`/turmas/${roomId}/problemas/${problemId}/sessoes/${session.id}`}
      className="flex items-center gap-4 rounded-[20px] border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-900"
    >
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
        <CalendarIcon className="size-6" />
      </div>

      <div className="flex flex-col overflow-hidden">
        <h3 className="truncate text-base font-bold text-ink">
          {session.titulo} · {formatSessionDate(session.data)}
        </h3>

        <p className="truncate text-xs text-muted">{session.descricao || 'Sem descrição'}</p>
      </div>
    </Link>
  );
}
