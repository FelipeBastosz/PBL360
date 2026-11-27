import { PerformanceTableCopiesController } from './performance-table-copies.controller';

describe('PerformanceTableCopiesController', () => {
  it('creates a table copy and maps it to the response contract', async () => {
    const table = {
      id: 'pt1',
      tutorId: 't1',
      name: 'Cópia',
      isDefault: false,
      description: null,
      problemCount: 0,
      sessionCount: 1,
      pastSessionCount: 0,
      criteria: [],
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-02'),
    };
    const copy = { execute: jest.fn().mockResolvedValue(table) };
    const controller = new PerformanceTableCopiesController(copy as never);
    await expect(
      controller.create('source', { nome: 'Cópia', salaId: 'r1' }, 't1'),
    ).resolves.toMatchObject({
      id: 'pt1',
      professorId: 't1',
      nome: 'Cópia',
      quantidadeSessoes: 1,
    });
    expect(copy.execute).toHaveBeenCalledWith({
      tableId: 'source',
      tutorId: 't1',
      name: 'Cópia',
      roomId: 'r1',
    });
  });
});
