import type { ComponentType, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdjustmentsHorizontalIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { ROUTES } from '@/routes/paths';
import { INTERACTIVE_CARD_CLASS } from '@/components/ui/cardStyles';
import { cn } from '@/utils/cn';

const ACTION_CLASS = cn(INTERACTIVE_CARD_CLASS, 'flex-row items-center gap-4 p-4 text-left');

type ActionContentProps = {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  description: ReactNode;
};

function ActionContent({ Icon, title, description }: ActionContentProps) {
  return (
    <>
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900 transition-[scale] duration-200 group-hover:scale-105">
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
  const navigate = useNavigate();
  if (!isProfessor) return null;

  const gradesPath = ROUTES.problemGrades
    .replace(':roomId', roomId)
    .replace(':problemId', problemId);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => navigate(gradesPath)} className={ACTION_CLASS}>
        <ActionContent
          Icon={DocumentTextIcon}
          title="Relatório Final"
          description="Nota final do problema"
        />
      </button>

      <button type="button" disabled className={`${ACTION_CLASS} cursor-not-allowed opacity-60`}>
        <ActionContent Icon={AdjustmentsHorizontalIcon} title="Fórmulas" description="Em breve" />
      </button>
    </div>
  );
}
