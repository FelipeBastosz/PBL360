import {
  toPeerEvaluationResponse,
  toSavePeerEvaluationInput,
  toSessionPeersResponse,
} from './peer-evaluations.mapper';
import { EvaluationStatusResponse } from '../../application/dtos/session-evaluation-summary-response.dto';

describe('peer-evaluations.mapper', () => {
  it('maps SavePeerEvaluationDto to SavePeerEvaluationInput', () => {
    const dto = {
      itens: [{ criterioId: 'crit-1', nota: 8.5 }],
      enviar: true,
    };
    const input = toSavePeerEvaluationInput(dto, 'sess-1', 'peer-1', 'student-1');

    expect(input).toEqual({
      sessionId: 'sess-1',
      peerId: 'peer-1',
      studentId: 'student-1',
      itens: [{ criterionId: 'crit-1', score: 8.5 }],
      enviar: true,
    });
  });

  it('maps ListSessionPeersOutput to SessionPeersResponseDto', () => {
    const output = {
      liberada: true,
      prazo: new Date('2026-10-15T23:59:59Z'),
      chamadaRealizada: true,
      formula: { criteriaWeight: 70, roleWeight: 30 },
      colegas: [
        {
          alunoId: 'peer-1',
          nome: 'Lucas Silva',
          iniciais: 'LS',
          status: EvaluationStatusResponse.RASCUNHO,
          papel: null,
        },
      ],
    };

    const response = toSessionPeersResponse(output);
    expect(response).toEqual({
      liberada: true,
      prazo: output.prazo,
      chamadaRealizada: true,
      formula: { criteriaWeight: 70, roleWeight: 30 },
      colegas: [
        {
          alunoId: 'peer-1',
          nome: 'Lucas Silva',
          iniciais: 'LS',
          status: EvaluationStatusResponse.RASCUNHO,
          papel: null,
        },
      ],
    });
  });

  it('maps GetPeerEvaluationOutput to PeerEvaluationResponseDto', () => {
    const output = {
      colega: { alunoId: 'peer-1', nome: 'Lucas Silva', papel: null },
      status: EvaluationStatusResponse.ENVIADA,
      enviadaEm: new Date('2026-10-10T12:00:00Z'),
      notaCargo: null,
      formula: { criteriaWeight: 70, roleWeight: 30 },
      criterios: [{ id: 'crit-1', nome: 'Critério', peso: 2, notaMaxima: 10 }],
      itens: [{ criterioId: 'crit-1', nota: 9 }],
    };

    const response = toPeerEvaluationResponse(output);
    expect(response).toEqual({
      colega: { alunoId: 'peer-1', nome: 'Lucas Silva', papel: null },
      status: EvaluationStatusResponse.ENVIADA,
      enviadaEm: output.enviadaEm,
      notaCargo: null,
      formula: { criteriaWeight: 70, roleWeight: 30 },
      criterios: [{ id: 'crit-1', nome: 'Critério', peso: 2, notaMaxima: 10 }],
      itens: [{ criterioId: 'crit-1', nota: 9 }],
    });
  });
});
