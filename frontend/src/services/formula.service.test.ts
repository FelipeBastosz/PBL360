import type { AxiosAdapter, AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Formula } from '@/types/formula';
import { api } from './api';
import { formulaService } from './formula.service';

const originalAdapter = api.defaults.adapter;

const formula: Formula = {
  escopo: 'SESSAO',
  padrao: false,
  versao: 2,
  componentes: [{ tipo: 'CRITERIO', referenciaId: 'c1', nome: 'Participação', peso: 100 }],
};

function respondWith(data: unknown) {
  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    return { status: 200, data, statusText: '', headers: {}, config } as AxiosResponse;
  });
  api.defaults.adapter = adapter;
  return adapter;
}

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

const URL = '/salas/room-1/problemas/problem-1/formulas';

describe('formulaService', () => {
  it('gets the formula of a scope', async () => {
    const adapter = respondWith(formula);

    const result = await formulaService.get('room-1', 'problem-1', 'SESSAO');

    expect(adapter.mock.calls[0]![0]).toMatchObject({
      method: 'get',
      url: URL,
      params: { escopo: 'SESSAO' },
    });
    expect(result).toEqual(formula);
  });

  it('saves the components without their display names', async () => {
    const adapter = respondWith(formula);

    await formulaService.save('room-1', 'problem-1', 'SESSAO', formula.componentes);

    const config = adapter.mock.calls[0]![0];
    expect(config).toMatchObject({ method: 'put', url: URL });
    expect(JSON.parse(config.data as string)).toEqual({
      escopo: 'SESSAO',
      componentes: [{ tipo: 'CRITERIO', referenciaId: 'c1', peso: 100 }],
    });
  });

  it('restores the default formula of a scope', async () => {
    const adapter = respondWith(formula);

    await formulaService.restoreDefault('room-1', 'problem-1', 'PROBLEMA');

    const config = adapter.mock.calls[0]![0];
    expect(config).toMatchObject({ method: 'post', url: `${URL}/restaurar-padrao` });
    expect(JSON.parse(config.data as string)).toEqual({ escopo: 'PROBLEMA' });
  });
});
