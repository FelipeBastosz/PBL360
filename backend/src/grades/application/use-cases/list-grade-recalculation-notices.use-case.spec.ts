import type { GradeRecalculationRepository } from '../../domain/repositories/grade-recalculation.repository';
import { ListGradeRecalculationNoticesUseCase } from './list-grade-recalculation-notices.use-case';

describe('ListGradeRecalculationNoticesUseCase', () => {
  it('returns a session-specific message with previous and updated scores', async () => {
    const notices: jest.Mocked<GradeRecalculationRepository> = {
      findNoticesByStudentId: jest.fn().mockResolvedValue([
        {
          id: 'notice-1',
          sessionId: 'session-1',
          sessionTitle: 'Sessão 2',
          previousScore: 6.4,
          newScore: 6.54,
          reasonCode: 'CRITERION_WEIGHTS_CHANGED',
          createdAt: new Date('2026-10-12T12:00:00Z'),
        },
      ]),
    };
    const useCase = new ListGradeRecalculationNoticesUseCase(notices);

    await expect(useCase.execute('student-1')).resolves.toMatchObject([
      {
        id: 'notice-1',
        sessaoId: 'session-1',
        sessao: 'Sessão 2',
        notaAnterior: 6.4,
        notaAtualizada: 6.54,
        motivo: 'Nota recalculada devido à alteração dos pesos dos critérios de avaliação.',
      },
    ]);
    expect(notices.findNoticesByStudentId).toHaveBeenCalledWith('student-1');
  });
});
