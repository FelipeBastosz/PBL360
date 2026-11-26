import { Link } from 'react-router-dom';
import type { Problem } from '@/types/problem';

type ProblemCardProps = {
  problem: Problem;
  roomId: string;
};

export function ProblemCard({ problem, roomId }: ProblemCardProps) {
  return (
    <Link
      to={`/turmas/${roomId}/problemas/${problem.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-elevated shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-accent"
    >
      <div className="h-1.5 w-full bg-brand-stripe" />
      <div className="flex flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-bold text-ink">{problem.titulo}</h3>
      </div>
    </Link>
  );
}
