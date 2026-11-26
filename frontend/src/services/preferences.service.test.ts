import type { AxiosAdapter, AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { preferencesService } from './preferences.service';

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('preferencesService', () => {
  it('fetches authenticated user preferences from GET /usuarios/minhas-preferencias', async () => {
    const expected = { tema: 'ESCURO', cor: '#0F766E' };
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      return { status: 200, data: expected, statusText: '', headers: {}, config } as AxiosResponse;
    });
    api.defaults.adapter = adapter;

    await expect(preferencesService.getMyPreferences()).resolves.toEqual(expected);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/usuarios/minhas-preferencias',
    });
  });

  it('persists partial updates via PUT /usuarios/minhas-preferencias', async () => {
    const response = { tema: 'ESCURO', cor: '#000077' };
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      return { status: 200, data: response, statusText: '', headers: {}, config } as AxiosResponse;
    });
    api.defaults.adapter = adapter;

    await expect(preferencesService.updateMyPreferences({ tema: 'ESCURO' })).resolves.toEqual(
      response,
    );
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'put',
      url: '/usuarios/minhas-preferencias',
      data: JSON.stringify({ tema: 'ESCURO' }),
    });
  });
});
