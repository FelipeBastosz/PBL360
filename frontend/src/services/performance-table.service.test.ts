import type { AxiosAdapter, AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PerformanceTable } from '@/types/performanceTable';
import { api } from './api';
import { createMockPerformanceTableService } from './mocks/performance-table.mock';
import { httpPerformanceTableService as performanceTableService } from './performance-table.service';

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

const table: PerformanceTable = {
  id: 'table-1',
  professorId: 'tutor-1',
  nome: 'Barema PBL',
  descricao: null,
  quantidadeProblemas: 0,
  criterios: [
    {
      id: 'criterion-1',
      nome: 'Domínio do tema',
      descricao: null,
      peso: 3,
      ordem: 1,
    },
  ],
  criadoEm: '2026-09-01T10:00:00.000Z',
  atualizadoEm: '2026-09-01T10:00:00.000Z',
};

const payload = {
  nome: 'Barema PBL',
  criterios: [
    {
      nome: 'Domínio do tema',
      peso: 3,
      ordem: 1,
    },
  ],
};

describe('performanceTableService', () => {
  it('lists the tables of the tutor', async () => {
    const adapter = respondWith([{ id: 'table-1', quantidadeCriterios: 1 }]);

    const result = await performanceTableService.list();

    expect(adapter.mock.calls[0]![0]).toMatchObject({ method: 'get', url: '/tabelas-desempenho' });
    expect(result).toEqual([{ id: 'table-1', quantidadeCriterios: 1 }]);
  });

  it('gets the detail of a table', async () => {
    const adapter = respondWith(table);

    const result = await performanceTableService.getById('table-1');

    expect(adapter.mock.calls[0]![0]).toMatchObject({
      method: 'get',
      url: '/tabelas-desempenho/table-1',
    });
    expect(result).toEqual(table);
  });

  it('creates a table with its criteria in the same body', async () => {
    const adapter = respondWith(table, 201);

    await performanceTableService.create(payload);

    const config = adapter.mock.calls[0]![0];
    expect(config).toMatchObject({ method: 'post', url: '/tabelas-desempenho' });
    expect(JSON.parse(config.data as string)).toEqual(payload);
  });

  it('updates a table', async () => {
    const adapter = respondWith(table);

    await performanceTableService.update('table-1', { nome: 'Novo nome' });

    const config = adapter.mock.calls[0]![0];
    expect(config).toMatchObject({ method: 'patch', url: '/tabelas-desempenho/table-1' });
    expect(JSON.parse(config.data as string)).toEqual({ nome: 'Novo nome' });
  });

  it('removes a table', async () => {
    const adapter = respondWith(undefined, 204);

    await performanceTableService.remove('table-1');

    expect(adapter.mock.calls[0]![0]).toMatchObject({
      method: 'delete',
      url: '/tabelas-desempenho/table-1',
    });
  });
});

describe('mockPerformanceTableService', () => {
  it('lists the demo tables with criteria and usage counters', async () => {
    const service = createMockPerformanceTableService();

    const tables = await service.list();

    expect(
      tables.map((item) => [item.nome, item.quantidadeCriterios, item.quantidadeProblemas]),
    ).toEqual([
      ['Barema PBL', 6, 2],
      ['Avaliação de sessão curta', 3, 0],
    ]);
  });

  it('creates, updates and removes a table', async () => {
    const service = createMockPerformanceTableService();

    const created = await service.create(payload);
    expect(created.criterios).toHaveLength(1);
    expect(await service.list()).toHaveLength(3);

    const updated = await service.update(created.id, { nome: 'Renomeada' });
    expect(updated.nome).toBe('Renomeada');
    expect(updated.criterios).toEqual(created.criterios);

    await service.remove(created.id);
    expect(await service.list()).toHaveLength(2);
  });

  it('fails when the table does not exist', async () => {
    const service = createMockPerformanceTableService();

    await expect(service.getById('missing')).rejects.toThrow('não encontrada');
  });
});
