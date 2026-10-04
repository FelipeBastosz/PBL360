import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { sessionService } from './session.service';

const originalAdapter = api.defaults.adapter;

function respondWith(data: unknown) {
  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    return { status: 200, data, statusText: '', headers: {}, config } as AxiosResponse;
  });
  api.defaults.adapter = adapter;
  return adapter;
}

const sent = (adapter: ReturnType<typeof respondWith>): InternalAxiosRequestConfig =>
  adapter.mock.calls[0][0];

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('sessionService', () => {
  it('reads the roll call of a session', async () => {
    const adapter = respondWith({ sessaoId: 's1' });

    await expect(sessionService.getRollCall('s1')).resolves.toEqual({ sessaoId: 's1' });
    expect(sent(adapter)).toMatchObject({ method: 'get', url: '/sessoes/s1/chamada' });
  });

  it('saves the roll call as a batch of records', async () => {
    const adapter = respondWith({ sessaoId: 's1', origem: 'REGISTRADA' });
    const registros = [
      { alunoId: 'a1', status: 'PRESENTE' as const, lugar: 1, justificativa: null },
    ];

    await sessionService.saveRollCall('s1', registros);

    expect(sent(adapter)).toMatchObject({ method: 'put', url: '/sessoes/s1/chamada' });
    expect(JSON.parse(sent(adapter).data as string)).toEqual({ registros });
  });

  it('lists and assigns session roles', async () => {
    const adapter = respondWith([]);
    await sessionService.listRoles('s1');
    expect(sent(adapter)).toMatchObject({ method: 'get', url: '/sessoes/s1/papeis' });

    const assign = respondWith({ alunoId: 'a1', papel: 'COORDENADOR', notaAdicional: 0.5 });
    const payload = { papel: 'COORDENADOR' as const, notaAdicional: 0.5, transferir: true };
    await sessionService.assignRole('s1', 'a1', payload);
    expect(sent(assign)).toMatchObject({ method: 'put', url: '/sessoes/s1/papeis/a1' });
    expect(JSON.parse(sent(assign).data as string)).toEqual(payload);
  });
});
