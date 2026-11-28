import type { ComponentType, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdjustmentsHorizontalIcon,
  ChatBubbleBottomCenterTextIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { ROUTES } from '@/routes/paths';
import { INTERACTIVE_CARD_CLASS } from '@/components/ui/cardStyles';
import type { GeneralFeedbackResponse } from '@/types/feedback';
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
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold text-ink">{title}</h3>
        <p className="mt-1 text-xs text-muted">{description}</p>
      </div>
    </>
  );
}

function resolveFeedbackDescription(
  generalFeedback: GeneralFeedbackResponse | null | undefined,
  isLoading: boolean,
): ReactNode {
  if (isLoading) return 'Carregando feedback...';
  if (generalFeedback?.texto) return 'Feedback registrado';
  return 'Parecer geral da turma';
}

type ProblemTopActionsProps = {
  isProfessor: boolean;
  roomId: string;
  problemId: string;
  generalFeedback?: GeneralFeedbackResponse | null;
  isGeneralFeedbackLoading?: boolean;
  onOpenGeneralFeedback?: () => void;
};

export function ProblemTopActions({
  isProfessor,
  roomId,
  problemId,
  generalFeedback,
  isGeneralFeedbackLoading = false,
  onOpenGeneralFeedback,
}: ProblemTopActionsProps) {
  const navigate = useNavigate();
  if (!isProfessor) return null;

  const gradesPath = ROUTES.problemGrades
    .replace(':roomId', roomId)
    .replace(':problemId', problemId);

  const formulaPath = ROUTES.problemFormula
    .replace(':roomId', roomId)
    .replace(':problemId', problemId);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <button type="button" onClick={() => navigate(gradesPath)} className={ACTION_CLASS}>
        <ActionContent
          Icon={DocumentTextIcon}
          title="Relatório Final"
          description="Nota final do problema"
        />
      </button>

      <button type="button" onClick={() => navigate(formulaPath)} className={ACTION_CLASS}>
        <ActionContent
          Icon={AdjustmentsHorizontalIcon}
          title="Fórmulas"
          description="Pesos da nota final"
        />
      </button>

      <button type="button" onClick={onOpenGeneralFeedback} className={ACTION_CLASS}>
        <ActionContent
          Icon={ChatBubbleBottomCenterTextIcon}
          title="Feedback Geral"
          description={resolveFeedbackDescription(generalFeedback, isGeneralFeedbackLoading)}
        />
      </button>
    </div>
  );
}
