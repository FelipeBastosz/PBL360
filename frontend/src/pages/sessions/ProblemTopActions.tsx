import type { ComponentType, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdjustmentsHorizontalIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
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
      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-accent transition-transform duration-200 group-hover:scale-105">
        <Icon className="size-6" />
      </div>
      <div>
        <h3 className="text-base font-bold text-ink">{title}</h3>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
    </>
  );
}

type ProblemTopActionsProps = { isProfessor: boolean; roomId: string; problemId: string };

const fillParams = (template: string, roomId: string, problemId: string) =>
  template.replace(':roomId', roomId).replace(':problemId', problemId);

export function ProblemTopActions({ isProfessor, roomId, problemId }: ProblemTopActionsProps) {
  const navigate = useNavigate();
  const gradesPath = fillParams(ROUTES.problemGrades, roomId, problemId);
  const formulaPath = fillParams(ROUTES.problemFormula, roomId, problemId);
  const tableReportsPath = fillParams(ROUTES.problemTableReports, roomId, problemId);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {isProfessor && (
        <button type="button" onClick={() => navigate(gradesPath)} className={ACTION_CLASS}>
          <ActionContent
            Icon={DocumentTextIcon}
            title="Relatório Final"
            description="Nota final do problema"
          />
        </button>
      )}

      {isProfessor && (
        <button type="button" onClick={() => navigate(formulaPath)} className={ACTION_CLASS}>
          <ActionContent
            Icon={AdjustmentsHorizontalIcon}
            title="Fórmulas"
            description="Pesos da nota final"
          />
        </button>
      )}

      <button type="button" onClick={() => navigate(tableReportsPath)} className={ACTION_CLASS}>
        <ActionContent
          Icon={ClipboardDocumentListIcon}
          title="Relatórios de Mesa"
          description="Relatórios das sessões"
        />
      </button>
    </div>
  );
}
