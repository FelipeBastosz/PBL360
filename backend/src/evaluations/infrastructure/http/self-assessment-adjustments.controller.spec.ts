import { SelfAssessmentAdjustmentsController } from './self-assessment-adjustments.controller';

describe('SelfAssessmentAdjustmentsController', () => {
  it('creates an adjustment with session, student, author and request values', async () => {
    const createdAt = new Date('2026-02-01T00:00:00Z');
    const adjustment = {
      originalScore: 6,
      currentScore: 8,
      adjustment: {
        previousValue: 6,
        newValue: 8,
        justification: 'Correção validada',
        authorId: 't1',
        authorName: 'Tutor',
        createdAt,
      },
    };
    const create = { execute: jest.fn().mockResolvedValue(adjustment) };
    const controller = new SelfAssessmentAdjustmentsController(create as never, {} as never);
    const dto = { novaNota: 8, justificativa: 'Correção validada', tipo: 'NOTA' };

    await expect(controller.create('sess1', 's1', 't1', dto)).resolves.toMatchObject({
      alunoId: 's1',
      notaOriginal: 6,
      notaVigente: 8,
      ajuste: { valorNovo: 8, autorId: 't1' },
    });
    expect(create.execute).toHaveBeenCalledWith({
      sessionId: 'sess1',
      studentId: 's1',
      authorId: 't1',
      newScore: 8,
      justification: 'Correção validada',
      tipo: 'NOTA',
    });
  });

  it('filters adjustment history by type for the requesting tutor', async () => {
    const history = { originalScore: 6, currentScore: 8, adjustments: [] };
    const list = { execute: jest.fn().mockResolvedValue(history) };
    const controller = new SelfAssessmentAdjustmentsController({} as never, list as never);

    await expect(controller.list('sess1', 's1', 't1', { tipo: 'NOTA' } as never)).resolves.toEqual({
      notaOriginal: 6,
      notaVigente: 8,
      ajustes: [],
    });
    expect(list.execute).toHaveBeenCalledWith('sess1', 's1', 't1', 'NOTA');
  });
});
