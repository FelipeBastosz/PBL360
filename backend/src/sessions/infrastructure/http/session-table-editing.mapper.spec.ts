import {
  toSessionTableEditInput,
  toSessionTableEditResponse,
  toTableEditPermissionsResponse,
} from './session-table-editing.mapper';

describe('session table editing mappers', () => {
  it('maps edit input and result to the API contract', () => {
    expect(
      toSessionTableEditInput(
        {
          escopo: 'SESSAO',
          nome: 'Tabela',
          criterios: [{ id: 'c1', nome: 'Participação', peso: 100 }],
        } as never,
        's1',
        't1',
      ),
    ).toEqual({
      sessionId: 's1',
      tutorId: 't1',
      scope: 'SESSAO',
      name: 'Tabela',
      criteria: [{ id: 'c1', name: 'Participação', weight: 100 }],
    });
    expect(
      toSessionTableEditResponse({
        table: { id: 'pt1', name: 'Atualizada' },
        sessions: [{ sessionId: 's1', label: 'Sessão 1' }],
      }),
    ).toEqual({
      tabela: { id: 'pt1', nome: 'Atualizada' },
      sessoesAtualizadas: [{ sessaoId: 's1', rotulo: 'Sessão 1' }],
    });
  });

  it('maps edit permissions including an empty session list', () => {
    expect(
      toTableEditPermissionsResponse({
        canEditCriteria: false,
        reason: 'Tabela em uso',
        sessions: [{ sessionId: 's1', label: 'Sessão 1', hasOccurred: true }],
      }),
    ).toEqual({
      podeEditarCriterios: false,
      motivo: 'Tabela em uso',
      sessoesQueUsam: [{ sessaoId: 's1', rotulo: 'Sessão 1', jaAconteceu: true }],
    });
    expect(
      toTableEditPermissionsResponse({ canEditCriteria: true, reason: null, sessions: [] }),
    ).toEqual({
      podeEditarCriterios: true,
      motivo: null,
      sessoesQueUsam: [],
    });
  });
});
