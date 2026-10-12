import type { ComponentType, ReactNode, SVGProps } from 'react';
import {
  ChatBubbleBottomCenterTextIcon,
  ChevronRightIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

type EvaluationItem = {
  title: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const EVALUATIONS: EvaluationItem[] = [
  { title: 'Autoavaliação', Icon: UserCircleIcon },
  { title: 'Avaliar Colegas', Icon: UsersIcon },
  { title: 'Notas e Feedbacks', Icon: ChatBubbleBottomCenterTextIcon },
];

function EvaluationCard({ title, Icon }: EvaluationItem) {
  return (
    <li
      aria-disabled="true"
      className="flex cursor-not-allowed items-center gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-ink">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-lg font-semibold text-ink">{title}</span>
        <span className="rounded-md bg-black/5 px-2 py-0.5 text-xs font-semibold text-muted">
          Em breve
        </span>
      </span>
      <ChevronRightIcon className="size-5 shrink-0 text-muted/60" aria-hidden />
    </li>
  );
}

export function StudentEvaluationCenter({ children }: { children?: ReactNode }) {
  return (
    <section aria-labelledby="student-evaluations-title" className="flex flex-col gap-3">
      <h2 id="student-evaluations-title" className="text-lg font-semibold text-brand-900">
        Central de Avaliações
      </h2>
      {children}
      <ul className="flex flex-col gap-3">
        {EVALUATIONS.map((item) => (
          <EvaluationCard key={item.title} {...item} />
        ))}
      </ul>
    </section>
  );
}
