import type { AxiosAdapter, AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { evaluationHistoryService } from './evaluationHistory.service';

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

describe('evaluationHistoryService', () => {
  it('lists the session evaluation history', async () => {
    const body = { alunos: [] };
    const adapter = respondWith(body);

    await expect(evaluationHistoryService.list('sess-1')).resolves.toEqual(body);

    const config = adapter.mock.calls[0][0];
    expect(config.method).toBe('get');
    expect(config.url).toBe('/sessoes/sess-1/historico-avaliacoes');
  });
});
