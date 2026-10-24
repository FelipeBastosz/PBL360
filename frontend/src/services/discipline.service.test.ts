import type { AxiosAdapter, AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { disciplineService } from './discipline.service';

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('disciplineService', () => {
  it('lists the registered disciplines', async () => {
    const disciplines = [{ id: 'd-1', codigo: 'EXA863', nome: 'MI Programação' }];
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      return {
        status: 200,
        data: disciplines,
        statusText: '',
        headers: {},
        config,
      } as AxiosResponse;
    });
    api.defaults.adapter = adapter;

    await expect(disciplineService.list()).resolves.toEqual(disciplines);
    expect(adapter.mock.calls[0][0]).toMatchObject({ method: 'get', url: '/disciplinas' });
  });
});
