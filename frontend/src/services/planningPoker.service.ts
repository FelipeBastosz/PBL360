import type {
  PlanningPokerAvailability,
  PlanningPokerState,
  PokerDecisionPayload,
  PokerReveal,
  PokerRound,
  StartPlanningPokerPayload,
} from '@/types/planningPoker';
import { api } from './api';

const pokerOf = (sessionId: string) => `/sessoes/${sessionId}/poker`;
const roundOf = (sessionId: string, roundId: string) => `${pokerOf(sessionId)}/rodadas/${roundId}`;

export const planningPokerService = {
  getState: (sessionId: string) =>
    api.get<PlanningPokerState>(pokerOf(sessionId)).then((r) => r.data),

  getAvailability: (sessionId: string) =>
    api.get<PlanningPokerAvailability>(`${pokerOf(sessionId)}/disponibilidade`).then((r) => r.data),

  start: (sessionId: string, payload: StartPlanningPokerPayload) =>
    api.post<PlanningPokerState>(pokerOf(sessionId), payload).then((r) => r.data),

  reorderQueue: (sessionId: string, fila: string[]) =>
    api.put<{ fila: string[] }>(`${pokerOf(sessionId)}/fila`, { fila }).then((r) => r.data),

  openRound: (sessionId: string, alunoId?: string) =>
    api
      .post<PokerRound>(`${pokerOf(sessionId)}/rodadas`, alunoId ? { alunoId } : {})
      .then((r) => r.data),

  cancelRound: (sessionId: string, roundId: string) =>
    api.delete(roundOf(sessionId, roundId)).then(() => undefined),

  vote: (sessionId: string, roundId: string, nota: number) =>
    api
      .put<{ votou: boolean; nota: number }>(`${roundOf(sessionId, roundId)}/voto`, { nota })
      .then((r) => r.data),

  reveal: (sessionId: string, roundId: string) =>
    api.post<PokerReveal>(`${roundOf(sessionId, roundId)}/revelar`).then((r) => r.data),

  revote: (sessionId: string, roundId: string) =>
    api.post<PokerRound>(`${roundOf(sessionId, roundId)}/revotar`).then((r) => r.data),

  decide: (sessionId: string, roundId: string, payload: PokerDecisionPayload) =>
    api.post(`${roundOf(sessionId, roundId)}/decisao`, payload).then((r) => r.data),

  close: (sessionId: string) => api.post(`${pokerOf(sessionId)}/encerrar`).then((r) => r.data),
};
