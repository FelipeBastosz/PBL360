import type { AxiosAdapter, AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { sessionService } from './session.service';

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

const mockSession = {
  id: 'sess-1',
  titulo: 'Sessão 1',
  descricao: 'Primeira sessão',
  data: '2026-10-15',
  ordem: 1,
  status: 'agendada',
};

describe('sessionService', () => {
  it('lists sessions of a problem', async () => {
    const adapter = respondWith([mockSession]);

    await expect(sessionService.list('room-1', 'prob-1')).resolves.toEqual([mockSession]);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/salas/room-1/problemas/prob-1/sessoes',
    });
  });

  it('fetches a single session by id', async () => {
    const adapter = respondWith(mockSession);

    await expect(sessionService.getById('room-1', 'prob-1', 'sess-1')).resolves.toEqual(
      mockSession,
    );
    expect(adapter.mock.calls[0][0].url).toBe('/salas/room-1/problemas/prob-1/sessoes/sess-1');
  });

  it('creates a session', async () => {
    const adapter = respondWith(mockSession, 201);
    const payload = { titulo: 'Sessão 1', descricao: null, data: '2026-10-15' };

    await expect(sessionService.create('room-1', 'prob-1', payload)).resolves.toEqual(mockSession);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'post',
      url: '/salas/room-1/problemas/prob-1/sessoes',
    });
  });

  it('updates a session', async () => {
    const updated = { ...mockSession, titulo: 'Sessão Atualizada' };
    const adapter = respondWith(updated);
    const payload = { titulo: 'Sessão Atualizada', descricao: null, data: '2026-10-15' };

    await expect(sessionService.update('room-1', 'prob-1', 'sess-1', payload)).resolves.toEqual(
      updated,
    );
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'put',
      url: '/salas/room-1/problemas/prob-1/sessoes/sess-1',
    });
  });

  it('fetches deletion impact of a session', async () => {
    const impact = {
      podeExcluir: true,
      chamada: 0,
      papeis: 0,
      observacoes: 0,
      avaliacoes: 0,
      feedbacks: 0,
    };
    const adapter = respondWith(impact);

    await expect(sessionService.getDeletionImpact('room-1', 'prob-1', 'sess-1')).resolves.toEqual(
      impact,
    );
    expect(adapter.mock.calls[0][0].url).toBe(
      '/salas/room-1/problemas/prob-1/sessoes/sess-1/impacto-exclusao',
    );
  });

  it('deletes a session', async () => {
    const adapter = respondWith(undefined, 204);

    await expect(sessionService.remove('room-1', 'prob-1', 'sess-1')).resolves.toBeUndefined();
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'delete',
      url: '/salas/room-1/problemas/prob-1/sessoes/sess-1',
    });
  });
});
