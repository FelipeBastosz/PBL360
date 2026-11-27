import { PokerOrder } from '../../domain/entities/planning-poker';
import {
  PokerDecisionPayload,
  PokerOrderPayload,
} from '../../application/dtos/planning-poker-request.dto';
import { PokerBlockReason } from '../../application/services/poker-start-policy';
import {
  POKER_ORDER_TO_DOMAIN,
  toAvailabilityResponse,
  toCloseResponse,
  toDecisionAction,
  toDecisionResponse,
  toPlanningPokerStateResponse,
  toTutorStateResponse,
} from './planning-poker.mapper';

describe('planning poker mappers', () => {
  const state = {
    poker: { id: 'p1', anonymous: true, order: PokerOrder.SEQUENTIAL },
    participants: [{ id: 's1', name: 'Ana', initials: 'A', hasPhoto: false, seatNumber: 1 }],
    absentees: [],
    queue: ['s1'],
    completed: [
      {
        student: { id: 's2', name: 'Bia', initials: 'B' },
        average: 8,
        finalGrade: 9,
        adjusted: true,
      },
    ],
  };

  it('maps tutor and student states and both current round states', () => {
    const round = {
      roundId: 'r1',
      number: 1,
      status: 'VOTING',
      evaluated: state.participants[0],
      table: [],
      expectedVoters: 1,
      votedSeats: [],
      reveal: null,
      isEvaluated: true,
      myVote: 8,
      mySeat: 1,
    };
    expect(toTutorStateResponse({ ...state, current: round } as never)).toMatchObject({
      pokerId: 'p1',
      anonimo: true,
      ordem: 'SEQUENCIAL',
      status: 'ABERTO',
      fila: ['s1'],
      concluidas: [{ alunoId: 's2', notaFinal: 9, ajustada: true }],
      rodadaAtual: { rodadaId: 'r1' },
    });
    expect(
      toPlanningPokerStateResponse({
        audience: 'STUDENT',
        state: {
          ...state,
          isParticipant: true,
          current: round,
        },
      } as never),
    ).toMatchObject({
      concluidas: [{ alunoId: 's2', nome: 'Bia' }],
      rodadaAtual: { rodadaId: 'r1', souAvaliado: true, meuVoto: 8, meuLugar: 1 },
      participante: true,
    });
    expect(
      toPlanningPokerStateResponse({
        audience: 'TUTOR',
        state: { ...state, current: null },
      } as never),
    ).toMatchObject({ rodadaAtual: null });
    expect(
      toPlanningPokerStateResponse({
        audience: 'STUDENT',
        state: { ...state, isParticipant: false, current: null },
      } as never),
    ).toMatchObject({ rodadaAtual: null, participante: false });
  });

  it('maps availability, decision actions, decisions and closure results', () => {
    expect(POKER_ORDER_TO_DOMAIN[PokerOrderPayload.MANUAL]).toBe(PokerOrder.MANUAL);
    expect(
      toAvailabilityResponse({ blockReason: null, presentStudents: 3, openPokerId: 'p1' }),
    ).toEqual({ disponivel: true, motivo: null, presentes: 3, pokerAbertoId: 'p1' });
    expect(
      toAvailabilityResponse({
        blockReason: PokerBlockReason.ROLL_CALL_MISSING,
        presentStudents: 0,
        openPokerId: null,
      }),
    ).toMatchObject({ disponivel: false, motivo: 'Salve a chamada para começar.' });
    expect(
      toDecisionAction({
        acao: PokerDecisionPayload.REAJUSTAR,
        nota: 9,
        justificativa: 'revisão',
      }),
    ).toEqual({ type: 'ADJUST', grade: 9, justification: 'revisão' });
    expect(toDecisionAction({ acao: PokerDecisionPayload.REAJUSTAR })).toEqual({
      type: 'ADJUST',
      grade: 0,
      justification: '',
    });
    expect(toDecisionAction({ acao: PokerDecisionPayload.ACEITAR })).toEqual({
      type: 'ACCEPT',
    });
    expect(
      toDecisionResponse({
        studentId: 's1',
        average: 8,
        decision: { finalGrade: 9, adjusted: true, decidedBy: 't1', decidedAt: new Date() },
      } as never),
    ).toMatchObject({ alunoId: 's1', media: 8, notaFinal: 9, ajustada: true, decididoPor: 't1' });
    expect(
      toCloseResponse({
        evaluated: 1,
        notEvaluated: [{ id: 's2', name: 'Bia' }],
        results: [{ student: { id: 's1', name: 'Ana' }, finalGrade: 9, adjusted: false }],
      } as never),
    ).toEqual({
      avaliados: 1,
      naoAvaliados: [{ alunoId: 's2', nome: 'Bia' }],
      resultados: [{ alunoId: 's1', nome: 'Ana', notaFinal: 9, ajustada: false }],
    });
  });
});
