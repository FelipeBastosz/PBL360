import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AdjustmentsHorizontalIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '@/routes/paths';

const ACTION_CLASS =
  'flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md text-left';

type ActionContentProps = {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  description: ReactNode;
};

function ActionContent({ Icon, title, description }: ActionContentProps) {
  return (
    <>
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900">
        <Icon className="size-6" />
      </div>
      <div>
        <h3 className="text-base font-bold text-ink">{title}</h3>
        <p className="text-xs text-muted">{description}</p>
      </div>
    </>
  );
}

type ProblemTopActionsProps = { isProfessor: boolean; roomId: string; problemId: string };

export function ProblemTopActions({ isProfessor, roomId, problemId }: ProblemTopActionsProps) {
  if (!isProfessor) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => {}} className={ACTION_CLASS}>
        <ActionContent
          Icon={DocumentTextIcon}
          title="Relatório Final"
          description="Nota final do problema"
        />
      </button>
      <Link to={ROUTES.performanceTables} state={{ roomId, problemId }} className={ACTION_CLASS}>
        <ActionContent
          Icon={AdjustmentsHorizontalIcon}
          title="Fórmulas"
          description="Suas tabelas de critérios"
        />
      </Link>
    </div>
  );
}
