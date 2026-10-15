import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
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

const sent = (adapter: ReturnType<typeof respondWith>): InternalAxiosRequestConfig =>
  adapter.mock.calls[0][0];

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

  it('reads a session and the sessions of a room as a member', async () => {
    const adapter = respondWith({});
    await sessionService.getForMember('s1');
    expect(sent(adapter)).toMatchObject({ method: 'get', url: '/sessoes/s1' });

    const rooms = respondWith([]);
    await sessionService.listForRoom('r1');
    expect(sent(rooms)).toMatchObject({ method: 'get', url: '/salas/r1/sessoes' });
  });

  it('uploads a PDF as multipart form data in the arquivo field', async () => {
    const adapter = respondWith({ id: 'a1' }, 201);
    const file = new File(['%PDF-1.7'], 'Relatório.pdf', { type: 'application/pdf' });

    await sessionService.uploadAttachment('s1', file);

    expect(sent(adapter)).toMatchObject({ method: 'post', url: '/sessoes/s1/anexos' });
    expect((sent(adapter).data as FormData).get('arquivo')).toBeInstanceOf(File);
  });

  it('lists and downloads attachments', async () => {
    const list = respondWith([]);
    await sessionService.listAttachments('s1');
    expect(sent(list)).toMatchObject({ method: 'get', url: '/sessoes/s1/anexos' });

    const download = respondWith(new Blob(['%PDF']));
    await sessionService.downloadAttachment('s1', 'a1');
    expect(sent(download)).toMatchObject({ url: '/sessoes/s1/anexos/a1', responseType: 'blob' });
  });

  it('fetches release status for a session', async () => {
    const mockReleases = {
      autoavaliacao: { liberada: true, prazo: null, enviadas: 4, esperadas: 12 },
      pares: { liberada: false, prazo: null, enviadas: 0, esperadas: 12 },
      atualizadoEm: '2026-10-01T10:00:00.000Z',
      atualizadoPor: 'tutor-1',
    };
    const adapter = respondWith(mockReleases);

    await expect(sessionService.getReleases('sess-1')).resolves.toEqual(mockReleases);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/sessoes/sess-1/liberacoes',
    });
  });

  it('updates release configuration for a session', async () => {
    const payload = { autoavaliacao: { liberada: true, prazo: null } };
    const adapter = respondWith({}, 200);

    await sessionService.updateReleases('sess-1', payload);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'put',
      url: '/sessoes/sess-1/liberacoes',
    });
  });

  it('fetches session evaluation configuration', async () => {
    const mockConfig = {
      tabela: { id: 'tab-1', nome: 'Tabela 1', padrao: true, criterios: [] },
      formula: { padrao: true, versao: null, componentes: [] },
      bloqueada: false,
    };
    const adapter = respondWith(mockConfig);

    await expect(sessionService.getEvaluationConfig('sess-1')).resolves.toEqual(mockConfig);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/sessoes/sess-1/configuracao-avaliacao',
    });
  });

  it('applies performance table to session', async () => {
    const response = {
      sessoesAtualizadas: [{ sessaoId: 's1', rotulo: 'S1' }],
      sessoesIgnoradas: [],
    };
    const adapter = respondWith(response);
    const payload = { tabelaId: 'tab-1', aplicarNasSeguintes: true };

    await expect(sessionService.applyTable('sess-1', payload)).resolves.toEqual(response);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'put',
      url: '/sessoes/sess-1/tabela',
    });
  });

  it('fetches session evaluation configuration', async () => {
    const mockConfig = {
      tabela: { id: 'tab-1', nome: 'Tabela 1', padrao: true, criterios: [] },
      formula: { padrao: true, versao: null, componentes: [] },
      bloqueada: false,
    };
    const adapter = respondWith(mockConfig);

    await expect(sessionService.getEvaluationConfig('sess-1')).resolves.toEqual(mockConfig);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'get',
      url: '/sessoes/sess-1/configuracao-avaliacao',
    });
  });

  it('applies performance table to session', async () => {
    const response = {
      sessoesAtualizadas: [{ sessaoId: 's1', rotulo: 'S1' }],
      sessoesIgnoradas: [],
    };
    const adapter = respondWith(response);
    const payload = { tabelaId: 'tab-1', aplicarNasSeguintes: true };

    await expect(sessionService.applyTable('sess-1', payload)).resolves.toEqual(response);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'put',
      url: '/sessoes/sess-1/tabela',
    });
  });

  it('restores default formula for session', async () => {
    const response = { padrao: true, versao: null, componentes: [] };
    const adapter = respondWith(response);

    await expect(sessionService.restoreDefaultFormula('sess-1')).resolves.toEqual(response);
    expect(adapter.mock.calls[0][0]).toMatchObject({
      method: 'post',
      url: '/sessoes/sess-1/formula/restaurar-padrao',
    });
  });
});
