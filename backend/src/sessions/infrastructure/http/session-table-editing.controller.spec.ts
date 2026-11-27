import { SessionTableEditingController } from './session-table-editing.controller';

describe('SessionTableEditingController', () => {
  it('returns edit permission details', async () => {
    const permissions = {
      execute: jest.fn().mockResolvedValue({
        canEditCriteria: true,
        reason: null,
        sessions: [{ sessionId: 'sess1', label: 'Sessão 1', hasOccurred: false }],
      }),
    };
    const controller = new SessionTableEditingController(permissions as never, {} as never);

    await expect(controller.get('sess1', 't1')).resolves.toEqual({
      podeEditarCriterios: true,
      motivo: null,
      sessoesQueUsam: [{ sessaoId: 'sess1', rotulo: 'Sessão 1', jaAconteceu: false }],
    });
    expect(permissions.execute).toHaveBeenCalledWith('sess1', 't1');
  });

  it('maps table edits to the use case and maps the result', async () => {
    const edit = {
      execute: jest.fn().mockResolvedValue({
        table: { id: 'pt1', name: 'Barema' },
        sessions: [{ sessionId: 'sess1', label: 'Sessão 1' }],
      }),
    };
    const controller = new SessionTableEditingController({} as never, edit as never);
    const dto = {
      escopo: 'TODAS',
      nome: 'Barema',
      criterios: [{ id: 'c1', nome: 'Participação', peso: 10 }],
    };

    await expect(controller.put('sess1', 't1', dto)).resolves.toEqual({
      tabela: { id: 'pt1', nome: 'Barema' },
      sessoesAtualizadas: [{ sessaoId: 'sess1', rotulo: 'Sessão 1' }],
    });
    expect(edit.execute).toHaveBeenCalledWith({
      sessionId: 'sess1',
      tutorId: 't1',
      scope: 'TODAS',
      name: 'Barema',
      criteria: [{ id: 'c1', name: 'Participação', weight: 10 }],
    });
  });
});
