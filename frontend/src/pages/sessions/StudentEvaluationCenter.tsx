import type { ComponentType, SVGProps } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChatBubbleBottomCenterTextIcon,
  ChevronRightIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { ROUTES } from '@/routes/paths';

type EvaluationItem = {
  title: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  path?: string;
};

function EvaluationCard({ title, Icon, path }: EvaluationItem) {
  const isLocked = !path;

  const content = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-ink">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-lg font-semibold text-ink">{title}</span>
        {isLocked && (
          <span className="rounded-md bg-black/5 px-2 py-0.5 text-xs font-semibold text-muted">
            Em breve
          </span>
        )}
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-muted/60" aria-hidden />
    </>
  );

  if (isLocked) {
    return (
      <li
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm opacity-70"
      >
        {content}
      </li>
    );
  }

  return (
    <li>
      <Link
        to={path}
        className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition-colors hover:bg-surface-50 active:bg-surface-100"
      >
        {content}
      </Link>
    </li>
  );
}

export function StudentEvaluationCenter() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const evaluations: EvaluationItem[] = [
    {
      title: 'Autoavaliação',
      Icon: UserCircleIcon,
      path: sessionId ? ROUTES.studentSelfEvaluation.replace(':sessionId', sessionId) : undefined,
    },
    {
      title: 'Avaliar Colegas',
      Icon: UsersIcon,
      path: sessionId ? ROUTES.studentPeerEvaluation.replace(':sessionId', sessionId) : undefined,
    },
    { title: 'Notas e Feedbacks', Icon: ChatBubbleBottomCenterTextIcon },
  ];

  return (
    <section aria-labelledby="student-evaluations-title" className="flex flex-col gap-3">
      <h2 id="student-evaluations-title" className="text-lg font-semibold text-brand-900">
        Central de Avaliações
      </h2>
      <ul className="flex flex-col gap-3">
        {evaluations.map((item) => (
          <EvaluationCard key={item.title} {...item} />
        ))}
      </ul>
    </section>
  );
}
