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

const mockImpact = {
  sessoes: 2,
  notas: 5,
  feedbacks: 0,
  avaliacoes: 1,
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

  it('updates a problem of the room', async () => {
    const updatedProblem = { ...problem, titulo: 'Problema 1 Atualizado' };
    const adapter = respondWith(updatedProblem);
    const payload = { title: 'Problema 1 Atualizado' };

    await expect(problemService.update('room-1', 'problem-1', payload)).resolves.toEqual(
      updatedProblem,
    );

    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'put',
      url: '/salas/room-1/problemas/problem-1',
    });
    expect(JSON.parse(adapter.mock.calls[0][0].data as string)).toEqual(payload);
  });

  it('fetches deletion impact of a problem', async () => {
    const adapter = respondWith(mockImpact);

    await expect(problemService.getDeletionImpact('room-1', 'problem-1')).resolves.toEqual(
      mockImpact,
    );
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/salas/room-1/problemas/problem-1/impacto-exclusao',
    });
  });

  it('deletes a problem of the room', async () => {
    const adapter = respondWith(undefined, 204);

    await expect(problemService.remove('room-1', 'problem-1')).resolves.toBeUndefined();
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'delete',
      url: '/salas/room-1/problemas/problem-1',
    });
  });

  it('links a performance table to a problem', async () => {
    const response = { problemaId: 'problem-1', tabela: { id: 'table-1', nome: 'Barema PBL' } };
    const adapter = respondWith(response);

    await expect(
      problemService.changePerformanceTable('room-1', 'problem-1', 'table-1'),
    ).resolves.toEqual(response);
    const config = adapter.mock.calls[0]![0];
    expect(config).toMatchObject({
      method: 'put',
      url: '/salas/room-1/problemas/problem-1/tabela-desempenho',
    });
    expect(JSON.parse(config.data as string)).toEqual({ tabelaId: 'table-1' });
  });

  it('exports problem report in PDF format as blob', async () => {
    const fakeBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
    const adapter = respondWith(fakeBlob);

    await expect(problemService.exportReport('room-1', 'problem-1', 'PDF')).resolves.toEqual(
      fakeBlob,
    );

    const config = adapter.mock.calls[0]![0];
    expect(config).toMatchObject({
      method: 'get',
      url: '/salas/room-1/problemas/problem-1/relatorio/exportacao',
      params: { formato: 'PDF' },
      responseType: 'blob',
    });
  });

  it('exports problem report in XLSX format as blob', async () => {
    const fakeBlob = new Blob(['xlsx-content'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const adapter = respondWith(fakeBlob);

    await expect(problemService.exportReport('room-1', 'problem-1', 'XLSX')).resolves.toEqual(
      fakeBlob,
    );

    const config = adapter.mock.calls[0]![0];
    expect(config).toMatchObject({
      method: 'get',
      url: '/salas/room-1/problemas/problem-1/relatorio/exportacao',
      params: { formato: 'XLSX' },
      responseType: 'blob',
    });
  });
});
