import type { AxiosAdapter, AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { problemService } from './problem.service';

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

const problem = {
  id: 'problem-1',
  salaId: 'room-1',
  titulo: 'Problema 1',
  descricao: null,
  ordem: 1,
  dataInicio: '2026-03-01',
  dataFim: '2026-03-15',
  autoavaliacaoLiberada: false,
  avaliacaoEntreParesLiberada: false,
  liberadoEm: null,
  prazoAutoavaliacao: null,
  criadoPor: 'tutor-1',
  criadoEm: '2026-09-01T10:00:00.000Z',
  atualizadoEm: '2026-09-01T10:00:00.000Z',
};

describe('problemService', () => {
  it('lists the problems of a room', async () => {
    const adapter = respondWith([problem]);

    await expect(problemService.list('room-1')).resolves.toEqual([problem]);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/salas/room-1/problemas',
    });
  });

  it('fetches one problem of the room', async () => {
    const adapter = respondWith(problem);

    await expect(problemService.getById('room-1', 'problem-1')).resolves.toEqual(problem);
    expect(adapter.mock.calls[0][0].url).toBe('/salas/room-1/problemas/problem-1');
  });

  it('creates a problem with calendar dates', async () => {
    const adapter = respondWith(problem, 201);
    const payload = { titulo: 'Problema 1', dataInicio: '2026-03-01', dataFim: '2026-03-15' };

    await expect(problemService.create('room-1', payload)).resolves.toEqual(problem);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'post',
      url: '/salas/room-1/problemas',
    });
    expect(JSON.parse(adapter.mock.calls[0][0].data as string)).toEqual(payload);
  });
});
