import type { AxiosAdapter, AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { evaluationService } from './evaluation.service';

const originalAdapter = api.defaults.adapter;

function respondWith(data: unknown, status = 200) {
  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    return { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  });
  api.defaults.adapter = adapter;
  return adapter;
}

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

const mockEvaluations = [
  {
    alunoId: 'student-1',
    nome: 'Ana Souza',
    iniciais: 'AS',
    presenca: null,
    status: 'PENDENTE',
    notaSessao: null,
  },
];

const mockCriteria = {
  tabela: { id: 'table-1', nome: 'Tabela Tutorial' },
  criterios: [
    {
      id: 'crit-1',
      nome: 'Participação e Postura',
      peso: 1,
      notaMaxima: 10,
      ordem: 1,
    },
  ],
};

describe('evaluationService', () => {
  it('lists evaluation summaries for a session', async () => {
    const adapter = respondWith(mockEvaluations);

    await expect(evaluationService.listBySession('sess-1')).resolves.toEqual(mockEvaluations);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/sessoes/sess-1/avaliacoes',
    });
  });

  it('fetches problem evaluation criteria', async () => {
    const adapter = respondWith(mockCriteria);

    await expect(evaluationService.getProblemCriteria('room-1', 'prob-1')).resolves.toEqual(
      mockCriteria,
    );
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/salas/room-1/problemas/prob-1/criterios',
    });
  });
});
