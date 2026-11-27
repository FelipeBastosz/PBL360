import type { EntityManager } from 'typeorm';
import { readTableEditContext } from './session-table-editing.reads';

describe('readTableEditContext', () => {
  const detail = {
    id: 'table-1',
    tutorId: 'tutor-1',
    roomId: 'room-1',
    name: 'Padrão',
    description: null,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    problemCount: 0,
    criterionId: 'criterion-1',
    criterionName: 'Critério',
    criterionDescription: null,
    criterionOrderIndex: 1,
    criterionWeight: '10',
  };

  it('loads the table and session usage for an authorized tutor', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ tableId: 'table-1' }])
      .mockResolvedValueOnce([detail])
      .mockResolvedValueOnce([
        {
          sessionId: 'session-1',
          label: 'Sessão',
          roomId: 'room-1',
          hasOccurred: false,
          canAccess: true,
        },
      ]);
    const manager = { query } as unknown as EntityManager;

    await expect(readTableEditContext(manager, 'session-1', 'tutor-1')).resolves.toMatchObject({
      table: { id: 'table-1', name: 'Padrão', criteria: [{ id: 'criterion-1', weight: 10 }] },
      session: { sessionId: 'session-1', canAccess: true },
      sessions: [{ sessionId: 'session-1' }],
    });
    expect(manager.query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenNthCalledWith(3, expect.any(String), ['table-1', 'tutor-1', null]);
  });

  it('limits a default table to the current session', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ tableId: 'table-1' }])
      .mockResolvedValueOnce([{ ...detail, isDefault: true }])
      .mockResolvedValueOnce([
        {
          sessionId: 'session-1',
          label: 'Sessão',
          roomId: 'room-1',
          hasOccurred: true,
          canAccess: true,
        },
      ]);
    const manager = { query } as unknown as EntityManager;

    await readTableEditContext(manager, 'session-1', 'tutor-1');
    expect(query).toHaveBeenNthCalledWith(3, expect.any(String), [
      'table-1',
      'tutor-1',
      'session-1',
    ]);
  });

  it.each([
    { current: [], detailRows: [], usage: [], message: 'Sessão não encontrada.' },
    {
      current: [{ tableId: 'table-1' }],
      detailRows: [],
      usage: [],
      message: 'Tabela não encontrada.',
    },
    {
      current: [{ tableId: 'table-1' }],
      detailRows: [detail],
      usage: [],
      message: 'Sessão não encontrada.',
    },
    {
      current: [{ tableId: 'table-1' }],
      detailRows: [detail],
      usage: [
        {
          sessionId: 'session-1',
          label: 'Sessão',
          roomId: 'room-1',
          hasOccurred: false,
          canAccess: false,
        },
      ],
      message: 'Você não tem permissão para acessar esta sala.',
    },
  ])(
    'rejects missing or inaccessible context: $message',
    async ({ current, detailRows, usage, message }) => {
      const manager = {
        query: jest
          .fn()
          .mockResolvedValueOnce(current)
          .mockResolvedValueOnce(detailRows)
          .mockResolvedValueOnce(usage),
      } as unknown as EntityManager;

      await expect(readTableEditContext(manager, 'session-1', 'tutor-1')).rejects.toThrow(message);
    },
  );
});
