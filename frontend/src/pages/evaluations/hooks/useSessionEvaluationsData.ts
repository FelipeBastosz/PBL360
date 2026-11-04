import { useState, useEffect } from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { evaluationService } from '@/services/evaluation.service';
import { sessionService } from '@/services/session.service';
import { planningPokerService } from '@/services/planningPoker.service';
import type { SessionEvaluationSummary, ProblemEvaluationCriteria } from '@/types/evaluation';
import type { RollCall } from '@/types/session';

const STATUS_MAP: Record<string, SessionEvaluationSummary['presenca']> = {
  PRESENTE: 'presente',
  ATRASADO: 'presente',
  AUSENTE: 'ausente',
  JUSTIFICADO: 'justificado',
};

function mergeRollCallPresence(
  students: SessionEvaluationSummary[],
  rollCall: RollCall | null,
): SessionEvaluationSummary[] {
  return students.map((s) => {
    if (s.presenca) return s;
    const studentCall = rollCall?.alunos.find((a) => a.alunoId === s.alunoId);
    if (!studentCall?.status) return s;
    return { ...s, presenca: STATUS_MAP[studentCall.status] ?? s.presenca };
  });
}

export function useSessionEvaluationsData(sessionId?: string, roomId?: string, problemId?: string) {
  const [students, setStudents] = useState<SessionEvaluationSummary[]>([]);
  const [criteria, setCriteria] = useState<ProblemEvaluationCriteria | null>(null);
  const [rollCall, setRollCall] = useState<RollCall | null>(null);
  const [hasCheckedCriteria, setHasCheckedCriteria] = useState(false);
  const [hasOpenPoker, setHasOpenPoker] = useState(false);

  const {
    run: fetchStudents,
    isLoading: isLoadingStudents,
    error,
  } = useAsyncAction(evaluationService.listBySession);
  const { run: fetchCriteria, isLoading: isLoadingCriteria } = useAsyncAction(
    evaluationService.getProblemCriteria,
  );

  useEffect(() => {
    if (sessionId) {
      fetchStudents(sessionId).then((r) => r.ok && setStudents(r.data));
      sessionService
        .getRollCall(sessionId)
        .then(setRollCall)
        .catch(() => setRollCall(null));
      planningPokerService
        .getAvailability(sessionId)
        .then((res) => setHasOpenPoker(Boolean(res.pokerAbertoId)))
        .catch(() => setHasOpenPoker(false));
    }
    if (roomId && problemId) {
      fetchCriteria(roomId, problemId)
        .then((r) => {
          if (r.ok) setCriteria(r.data);
        })
        .finally(() => setHasCheckedCriteria(true));
    }
  }, [sessionId, roomId, problemId, fetchStudents, fetchCriteria]);

  const isLoading = isLoadingStudents || isLoadingCriteria;
  const hasMissingTable = hasCheckedCriteria && (!criteria || !criteria.tabela);
  const hasPendingRollCall = Boolean(rollCall && rollCall.registradaEm === null);

  return {
    students: mergeRollCallPresence(students, rollCall),
    isLoading,
    error,
    hasMissingTable,
    hasPendingRollCall,
    hasOpenPoker,
  };
}
