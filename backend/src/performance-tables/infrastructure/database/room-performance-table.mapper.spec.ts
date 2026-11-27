import { PerformanceTableOrigin } from '../../domain/repositories/performance-table.repository';
import { toRoomPerformanceTableItems } from './room-performance-table.mapper';

describe('toRoomPerformanceTableItems', () => {
  const row = (overrides: Record<string, unknown> = {}) => ({
    id: 'table-1',
    name: 'Tabela',
    description: null,
    roomId: 'room-1',
    isDefault: false,
    authorId: 't1',
    authorName: 'Tutor',
    createdAt: new Date('2025-01-01'),
    emUso: '2',
    criterionId: null,
    criterionName: null,
    criterionDescription: null,
    criterionOrderIndex: null,
    criterionWeight: null,
    ...overrides,
  });

  it('groups criteria by table and maps criteria with nullable metadata', () => {
    const result = toRoomPerformanceTableItems(
      [
        row({
          criterionId: 'c1',
          criterionName: 'Presença',
          criterionOrderIndex: '1',
          criterionWeight: '4.5',
        }),
        row({
          criterionId: 'c2',
          criterionName: 'Colaboração',
          criterionDescription: 'Atuação',
          criterionOrderIndex: 2,
          criterionWeight: 5,
        }),
        row(),
      ] as never,
      'room-1',
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'table-1',
      origem: PerformanceTableOrigin.TURMA,
      emUso: 2,
      criterios: [
        { id: 'c1', nome: 'Presença', ordem: 1, peso: 4.5, notaMaxima: 10 },
        { id: 'c2', nome: 'Colaboração', descricao: 'Atuação', ordem: 2, peso: 5, notaMaxima: 10 },
      ],
    });
  });

  it.each([
    [row({ isDefault: true }), PerformanceTableOrigin.PADRAO],
    [row({ roomId: null }), PerformanceTableOrigin.PESSOAL],
    [row({ roomId: 'another-room' }), PerformanceTableOrigin.TURMA],
  ])('determines table origin from its ownership', (item, origin) => {
    expect(toRoomPerformanceTableItems([item] as never, 'room-1')[0]?.origem).toBe(origin);
  });
});
