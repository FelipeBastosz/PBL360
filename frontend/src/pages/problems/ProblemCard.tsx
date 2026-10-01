import { Link } from 'react-router-dom';
import type { Problem } from '@/types/problem';
import { cn } from '@/utils/cn';

type ProblemCardProps = {
  problem: Problem;
  roomId: string;
};

function getEvaluationStatus(problem: Problem) {
  if (problem.autoavaliacaoLiberada) {
    return { label: 'Autoavaliação disponível', isAvailable: true };
  }
  if (problem.avaliacaoEntreParesLiberada) {
    return { label: 'Avaliação por pares disponível', isAvailable: true };
  }
  return { label: 'Avaliações indisponíveis', isAvailable: false };
}

export function ProblemCard({ problem, roomId }: ProblemCardProps) {
  const { label, isAvailable } = getEvaluationStatus(problem);

  return (
    <Link
      to={`/turmas/${roomId}/problemas/${problem.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-900"
    >
      <div className="h-1.5 w-full bg-brand-900" />
      <div className="flex flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-bold text-ink">{problem.titulo}</h3>
        <span
          className={cn(
            'inline-block w-fit rounded-md px-2.5 py-0.5 text-xs font-medium',
            isAvailable
              ? 'border border-success/20 bg-success-soft text-success'
              : 'bg-black/5 text-muted',
          )}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}
