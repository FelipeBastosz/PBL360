import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChatBubbleBottomCenterTextIcon,
  ChevronRightIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { Spinner } from '@/components/ui/Spinner';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ROUTES } from '@/routes/paths';
import { evaluationService } from '@/services/evaluation.service';
import type { StudentEvaluationSummaryResponse } from '@/types/evaluation';

type EvaluationCardProps = {
  title: string;
  badge: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  path?: string;
};

function EvaluationCard({ title, badge, Icon, path }: EvaluationCardProps) {
  const isLocked = !path;

  const content = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-ink">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-lg font-semibold text-ink">{title}</span>
        <span className="rounded-md bg-black/5 px-2 py-0.5 text-xs font-semibold text-muted">
          {badge}
        </span>
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

function resolveSelfBadge(summary?: StudentEvaluationSummaryResponse) {
  if (!summary?.autoavaliacao.liberada) return 'Bloqueada';
  if (summary.autoavaliacao.status === 'ENVIADA') return 'Enviada';
  if (summary.autoavaliacao.status === 'RASCUNHO') return 'Rascunho';
  return 'Pendente';
}

function resolvePeerBadge(summary?: StudentEvaluationSummaryResponse) {
  if (!summary?.pares.liberada) return 'Bloqueada';
  return `${summary.pares.avaliados}/${summary.pares.total} avaliados`;
}

type StudentEvaluationCenterProps = {
  children?: ReactNode;
  feedbackHref?: string;
};

export function StudentEvaluationCenter({ children, feedbackHref }: StudentEvaluationCenterProps) {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const [summary, setSummary] = useState<StudentEvaluationSummaryResponse | null>(null);

  const { run: loadSummary, isLoading } = useAsyncAction(
    useCallback(() => evaluationService.getMyEvaluationsSummary(sessionId), [sessionId]),
  );

  useEffect(() => {
    if (sessionId) loadSummary().then((r) => r.ok && setSummary(r.data));
  }, [sessionId, loadSummary]);

  const selfPath =
    summary?.autoavaliacao.liberada && sessionId
      ? ROUTES.studentSelfEvaluation.replace(':sessionId', sessionId)
      : undefined;

  const peerPath =
    summary?.pares.liberada && sessionId
      ? ROUTES.studentPeerEvaluation.replace(':sessionId', sessionId)
      : undefined;

  const feedbackPath = summary?.feedback.disponivel ? feedbackHref : undefined;

  return (
    <section aria-labelledby="student-evaluations-title" className="flex flex-col gap-3">
      <h2 id="student-evaluations-title" className="text-lg font-semibold text-brand-900">
        Central de Avaliações
      </h2>
      {children}
      {isLoading ? (
        <div className="mt-4 flex justify-center py-6">
          <Spinner className="size-8 text-brand-900" />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          <EvaluationCard
            title="Autoavaliação"
            badge={resolveSelfBadge(summary ?? undefined)}
            Icon={UserCircleIcon}
            path={selfPath}
          />
          <EvaluationCard
            title="Avaliar Colegas"
            badge={resolvePeerBadge(summary ?? undefined)}
            Icon={UsersIcon}
            path={peerPath}
          />
          <EvaluationCard
            title="Notas e Feedbacks"
            badge={summary?.feedback.disponivel ? 'Disponível' : 'Indisponível'}
            Icon={ChatBubbleBottomCenterTextIcon}
            path={feedbackPath}
          />
        </ul>
      )}
    </section>
  );
}
