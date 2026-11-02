import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { classReportService } from './class-report.service';

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

describe('classReportService', () => {
  it('fetches class final report for a given room', async () => {
    const mockData = {
      sala: {
        id: 'room-1',
        nome: 'Engenharia de Software - Turma A',
        codigoDisciplina: 'EXA123',
        semestre: '2026.2',
      },
      problemas: [{ id: 'prob-1', titulo: 'Problema 1', ordem: 1 }],
      alunos: [
        {
          id: 'student-1',
          nome: 'Ana Souza',
          matricula: '20260001',
          mediaGeral: 8.5,
          isParcial: false,
          notasProblemas: [{ problemaId: 'prob-1', notaFinal: 8.5 }],
        },
      ],
    };
    const adapter = respondWith(mockData);

    const result = await classReportService.getFinalReport('room-1');

    expect(sentRequest(adapter)).toMatchObject({
      method: 'get',
      url: '/salas/room-1/relatorio-final',
    });
    expect(result).toEqual(mockData);
  });

  it('exports class final report in PDF format as blob', async () => {
    const fakeBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
    const adapter = respondWith(fakeBlob);

    await expect(classReportService.exportFinalReport('room-1', 'PDF')).resolves.toEqual(fakeBlob);

    expect(sentRequest(adapter)).toMatchObject({
      method: 'get',
      url: '/salas/room-1/relatorio-final/exportacao',
      params: { formato: 'PDF' },
      responseType: 'blob',
    });
  });

  it('exports class final report in XLSX format as blob', async () => {
    const fakeBlob = new Blob(['xlsx-content'], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const adapter = respondWith(fakeBlob);

    await expect(classReportService.exportFinalReport('room-1', 'XLSX')).resolves.toEqual(fakeBlob);

    expect(sentRequest(adapter)).toMatchObject({
      method: 'get',
      url: '/salas/room-1/relatorio-final/exportacao',
      params: { formato: 'XLSX' },
      responseType: 'blob',
    });
  });
});
