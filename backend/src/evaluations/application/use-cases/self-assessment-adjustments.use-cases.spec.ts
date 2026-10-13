import { Test } from '@nestjs/testing';
import { ConflictError, ForbiddenError, NotFoundError } from '@/shared/errors/application.error';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { SELF_ASSESSMENT_ADJUSTMENT_REPOSITORY } from '../../domain/repositories/self-assessment-adjustment.repository';
import { EvaluationAccessService } from '../services/evaluation-access.service';
import { AdjustSelfAssessmentUseCase } from './adjust-self-assessment.use-case';
import { ListSelfAssessmentAdjustmentsUseCase } from './list-self-assessment-adjustments.use-case';

const context = { sessionId: 'session', problemId: 'problem', roomId: 'room' };
const adjustment = {
  previousValue: 7,
  newValue: 9,
  justification: 'Revisão após conversa com o aluno.',
  authorId: 'tutor',
  authorName: 'Tutor',
  createdAt: new Date('2026-10-12T12:00:00.000Z'),
};
const history = {
  evaluationId: 'evaluation',
  status: EvaluationStatus.SUBMITTED,
  originalScore: 7,
  adjustments: [adjustment],
};
const write = {
  sessionId: 'session',
  studentId: 'student',
  authorId: 'tutor',
  newScore: 9,
  justification: adjustment.justification,
};

describe('self-assessment adjustment use cases', () => {
  const access = { forStudent: jest.fn() };
  const repository = { record: jest.fn(), findHistory: jest.fn() };
  let adjust: AdjustSelfAssessmentUseCase;
  let list: ListSelfAssessmentAdjustmentsUseCase;

  beforeEach(async () => {
    jest.resetAllMocks();
    access.forStudent.mockResolvedValue(context);
    const module = await Test.createTestingModule({
      providers: [
        AdjustSelfAssessmentUseCase,
        ListSelfAssessmentAdjustmentsUseCase,
        { provide: EvaluationAccessService, useValue: access },
        { provide: SELF_ASSESSMENT_ADJUSTMENT_REPOSITORY, useValue: repository },
      ],
    }).compile();
    adjust = module.get(AdjustSelfAssessmentUseCase);
    list = module.get(ListSelfAssessmentAdjustmentsUseCase);
  });

  it('records the adjustment after checking access and exposes the new value as current', async () => {
    repository.record.mockResolvedValue({ originalScore: 7, adjustment });

    await expect(adjust.execute(write)).resolves.toEqual({
      originalScore: 7,
      currentScore: 9,
      adjustment,
    });
    expect(access.forStudent).toHaveBeenCalledWith('session', 'student', 'tutor');
    expect(repository.record).toHaveBeenCalledWith(write);
  });

  it('does not record an adjustment when access is denied', async () => {
    access.forStudent.mockRejectedValue(new ForbiddenError('Acesso negado.'));

    await expect(adjust.execute(write)).rejects.toThrow(ForbiddenError);
    expect(repository.record).not.toHaveBeenCalled();
  });

  it('propagates persistence rule failures', async () => {
    repository.record.mockRejectedValue(
      new ConflictError('A autoavaliação ainda não foi enviada.'),
    );

    await expect(adjust.execute(write)).rejects.toThrow(ConflictError);
  });

  it('lists the history of an existing self-assessment', async () => {
    repository.findHistory.mockResolvedValue(history);

    await expect(list.execute('session', 'student', 'tutor')).resolves.toEqual({
      originalScore: 7,
      currentScore: 9,
      adjustments: [adjustment],
    });
    expect(repository.findHistory).toHaveBeenCalledWith('session', 'student');
  });

  it('rejects listing a missing self-assessment', async () => {
    repository.findHistory.mockResolvedValue(null);

    await expect(list.execute('session', 'student', 'tutor')).rejects.toThrow(NotFoundError);
  });

  it('does not read the history when access is denied', async () => {
    access.forStudent.mockRejectedValue(new ForbiddenError('Acesso negado.'));

    await expect(list.execute('session', 'student', 'tutor')).rejects.toThrow(ForbiddenError);
    expect(repository.findHistory).not.toHaveBeenCalled();
  });
});
