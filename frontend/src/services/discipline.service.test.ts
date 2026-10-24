import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { disciplineService } from './discipline.service';

const originalAdapter = api.defaults.adapter;

function respondWith(data: unknown, status = 200) {
  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    return { status, data, statusText: '', headers: {}, config } as AxiosResponse;
  });
  api.defaults.adapter = adapter;
  return adapter;
}

function sentRequest(adapter: ReturnType<typeof respondWith>): InternalAxiosRequestConfig {
  return adapter.mock.calls[0][0];
}

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

const discipline = { id: 'd-1', codigo: 'EXA863', nome: 'MI Programação' };

describe('disciplineService', () => {
  it('lists the registered disciplines', async () => {
    const adapter = respondWith([discipline]);

    await expect(disciplineService.list()).resolves.toEqual([discipline]);
    expect(sentRequest(adapter)).toMatchObject({ method: 'get', url: '/disciplinas' });
  });

  it('registers a new discipline', async () => {
    const adapter = respondWith(discipline, 201);

    await expect(
      disciplineService.create({ codigo: 'EXA863', nome: 'MI Programação' }),
    ).resolves.toEqual(discipline);
    expect(sentRequest(adapter)).toMatchObject({ method: 'post', url: '/disciplinas' });
    expect(JSON.parse(sentRequest(adapter).data as string)).toEqual({
      codigo: 'EXA863',
      nome: 'MI Programação',
    });
  });
});
