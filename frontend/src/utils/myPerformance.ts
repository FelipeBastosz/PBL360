import type { ReceivedProblemFeedbacksResponse, ReceivedSessionFeedback } from '@/types/feedback';
import type { Problem } from '@/types/problem';
import type { PerformanceTimelineSession } from '@/types/studentPerformance';
import { parseApiDate } from '@/utils/date';

/**
 * A session as the student sees it: only what the API already released to them. Behaviour
 * marks are deliberately absent, because students must not see their own marks.
 */
export type MyPerformanceSession = PerformanceTimelineSession & {
  modalidade: 'AUTOAVALIACAO' | 'PARES' | null;
  feedback: string | null;
  feedbackAuthor: string | null;
};

type ProblemSessions = {
  problem: Pick<Problem, 'id' | 'titulo'>;
  response: ReceivedProblemFeedbacksResponse;
};

// Self and peer assessment sessions carry their grade on the session; a tutor grade comes
// with the feedback once it is sent. Either way, null means it was not released yet.
function releasedGrade(session: ReceivedSessionFeedback): number | null {
  if (session.nota !== undefined) return session.nota;
  return session.feedback?.nota ?? null;
}

export function toMyPerformanceSessions({
  problem,
  response,
}: ProblemSessions): MyPerformanceSession[] {
  return response.sessoes.map((session) => ({
    sessaoId: session.sessaoId,
    problemaId: problem.id,
    problemaTitulo: problem.titulo,
    rotulo: session.rotulo,
    data: session.data,
    nota: releasedGrade(session),
    modalidade: session.avaliacoes?.modalidade ?? null,
    feedback: session.feedback?.texto ?? null,
    feedbackAuthor: session.feedback?.autor.nome ?? null,
  }));
}

const dayOf = (value: string) => {
  const parts = parseApiDate(value);
  return parts ? Date.UTC(parts.year, parts.month - 1, parts.day) : Number.POSITIVE_INFINITY;
};

/** Same order as the tutor view: by date, then by problem order; the API order breaks ties. */
export function sortChronologically(groups: MyPerformanceSession[][]): MyPerformanceSession[] {
  return groups
    .flatMap((sessions, problemIndex) =>
      sessions.map((session, index) => ({ session, problemIndex, index })),
    )
    .sort(
      (a, b) =>
        dayOf(a.session.data) - dayOf(b.session.data) ||
        a.problemIndex - b.problemIndex ||
        a.index - b.index,
    )
    .map(({ session }) => session);
}
