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
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ROUTES } from '@/routes/paths';
import { evaluationService } from '@/services/evaluation.service';
import type { StudentEvaluationSummaryResponse } from '@/types/evaluation';
import { formatDeadline } from '@/utils/date';
import { NonParticipantEmptyState } from './components/NonParticipantEmptyState';

type EvaluationCardProps = {
  title: string;
  badge: string;
  reason?: string;
  deadline?: string | null;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  path?: string;
};

function EvaluationCard({ title, badge, reason, deadline, Icon, path }: EvaluationCardProps) {
  const isLocked = !path;

  const content = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-ink">
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-lg font-semibold text-ink">{title}</span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-black/5 px-2 py-0.5 text-xs font-semibold text-muted">
            {badge}
          </span>
          {deadline && (
            <span className="text-xs text-muted">Prazo: {formatDeadline(deadline)}</span>
          )}
        </div>
        {reason && <span className="text-xs leading-relaxed text-muted">{reason}</span>}
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

function resolveSelfBadge(summary?: StudentEvaluationSummaryResponse, isRollCallDone = false) {
  // Se a chamada não foi feita, ou se não foi liberada:
  if (!isRollCallDone || !summary?.autoavaliacao.liberada) {
    // Se a chamada já foi feita e o aluno tomou falta, mostra que não participou:
    if (isRollCallDone && summary?.autoavaliacao.status === 'NAO_PARTICIPOU') {
      return 'Não participou';
    }
    return 'Bloqueada';
  }

  if (summary.autoavaliacao.status === 'NAO_PARTICIPOU') return 'Não participou';
  if (summary.autoavaliacao.status === 'ENVIADA') return 'Enviada';
  if (summary.autoavaliacao.status === 'ENCERRADA') return 'Encerrada';
  if (summary.autoavaliacao.status === 'RASCUNHO') return 'Rascunho';
  return 'Pendente';
}

function resolvePeerBadge(summary?: StudentEvaluationSummaryResponse, isRollCallDone = false) {
  if (!isRollCallDone || !summary?.pares.liberada) return 'Bloqueada';
  return `${summary.pares.avaliados}/${summary.pares.total} avaliados`;
}

type EvaluationCardsListProps = {
  summary: StudentEvaluationSummaryResponse | null;
  isRollCallDone: boolean;
  selfPath?: string;
  peerPath?: string;
  feedbackPath?: string;
};

function EvaluationCardsList({
  summary,
  isRollCallDone,
  selfPath,
  peerPath,
  feedbackPath,
}: EvaluationCardsListProps) {
  return (
    <ul className="flex flex-col gap-3">
      <EvaluationCard
        title="Autoavaliação"
        badge={resolveSelfBadge(summary ?? undefined, isRollCallDone)}
        deadline={summary?.autoavaliacao.prazo}
        Icon={UserCircleIcon}
        path={selfPath}
      />
      <EvaluationCard
        title="Avaliar Colegas"
        badge={resolvePeerBadge(summary ?? undefined, isRollCallDone)}
        deadline={summary?.pares.prazo}
        Icon={UsersIcon}
        path={peerPath}
      />
      <EvaluationCard
        title="Notas e Feedbacks"
        badge={summary?.feedback.disponivel ? 'Disponível' : 'Indisponível'}
        reason={
          summary && !summary.feedback.disponivel && !summary.feedback.avaliacaoTutorEnviada
            ? 'Você ainda não foi avaliado pelo tutor nesta sessão.'
            : undefined
        }
        Icon={ChatBubbleBottomCenterTextIcon}
        path={feedbackPath}
      />
    </ul>
  );
}

function useStudentEvaluationCenterData(sessionId: string) {
  const [summary, setSummary] = useState<StudentEvaluationSummaryResponse | null>(null);
  const [isRollCallDone, setIsRollCallDone] = useState(false);

  const fetchCenterData = useCallback(async () => {
    const [summaryRes, peersRes] = await Promise.all([
      evaluationService.getMyEvaluationsSummary(sessionId).catch(() => null),
      evaluationService.listSessionPeers(sessionId).catch(() => null),
    ]);
    return { summary: summaryRes, chamadaRealizada: Boolean(peersRes?.chamadaRealizada) };
  }, [sessionId]);

  const { run: loadData } = useAsyncAction(fetchCenterData);

  useEffect(() => {
    if (!sessionId) return;
    loadData().then((r) => {
      if (r.ok && r.data) {
        setSummary(r.data.summary);
        setIsRollCallDone(r.data.chamadaRealizada);
      }
    });
  }, [sessionId, loadData]);

  return { summary, isRollCallDone };
}

function getEvaluationPaths(
  sessionId: string,
  summary: StudentEvaluationSummaryResponse | null,
  didNotParticipate: boolean,
) {
  const selfPath =
    !didNotParticipate &&
    summary?.autoavaliacao.liberada &&
    summary.autoavaliacao.status !== 'ENCERRADA' &&
    sessionId
      ? ROUTES.studentSelfEvaluation.replace(':sessionId', sessionId)
      : undefined;

  const peerPath =
    !didNotParticipate && summary?.pares.liberada && sessionId
      ? ROUTES.studentPeerEvaluation.replace(':sessionId', sessionId)
      : undefined;

  return { selfPath, peerPath };
}

type StudentEvaluationCenterProps = {
  children?: ReactNode;
  feedbackHref?: string;
};

export function StudentEvaluationCenter({ children, feedbackHref }: StudentEvaluationCenterProps) {
  const { sessionId = '' } = useParams<{ sessionId: string }>();
  const { summary, isRollCallDone } = useStudentEvaluationCenterData(sessionId);

  const didNotParticipate = isRollCallDone && summary?.participou === false;

  const { selfPath, peerPath } = getEvaluationPaths(sessionId, summary, didNotParticipate);

  return (
    <section aria-labelledby="student-evaluations-title" className="flex flex-col gap-3">
      <h2 id="student-evaluations-title" className="text-lg font-semibold text-brand-900">
        Central de Avaliações
      </h2>
      {children}
      {didNotParticipate ? (
        <NonParticipantEmptyState />
      ) : (
        <EvaluationCardsList
          summary={summary}
          isRollCallDone={isRollCallDone}
          selfPath={selfPath}
          peerPath={peerPath}
          feedbackPath={summary?.feedback.disponivel ? feedbackHref : undefined}
        />
      )}
    </section>
  );
}
