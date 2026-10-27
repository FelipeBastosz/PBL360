import { Test } from '@nestjs/testing';
import { ForbiddenError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { EvaluationAccessService } from '../services/evaluation-access.service';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository';
import { SaveTutorEvaluationUseCase } from './save-tutor-evaluation.use-case';

const context = { sessionId: 'session', problemId: 'problem', roomId: 'room' };
describe('SaveTutorEvaluationUseCase', () => {
  const access = { forStudent: jest.fn() };
  const repository = { recordEvaluation: jest.fn() };
  let useCase: SaveTutorEvaluationUseCase;
  beforeEach(async () => {
    jest.resetAllMocks();
    access.forStudent.mockResolvedValue(context);
    const module = await Test.createTestingModule({
      providers: [
        SaveTutorEvaluationUseCase,
        { provide: EvaluationAccessService, useValue: access },
        { provide: EVALUATION_REPOSITORY, useValue: repository },
      ],
    }).compile();
    useCase = module.get(SaveTutorEvaluationUseCase);
  });
  it('checks access before reading or saving the evaluation', async () => {
    repository.recordEvaluation.mockResolvedValue({ result: true });
    await expect(
      useCase.execute({
        sessionId: 'session',
        studentId: 'student',
        authorId: 'tutor',
        items: [],
        submit: false,
      }),
    ).resolves.toEqual({ result: true });
    expect(access.forStudent).toHaveBeenCalledWith('session', 'student', 'tutor');
    expect(repository.recordEvaluation).toHaveBeenCalledWith({
      sessionId: 'session',
      studentId: 'student',
      authorId: 'tutor',
      items: [],
      submit: false,
      context,
    });
  });
  it('does not touch persistence when access is denied', async () => {
    access.forStudent.mockRejectedValue(new ForbiddenError('Acesso negado.'));
    await expect(
      useCase.execute({
        sessionId: 'session',
        studentId: 'student',
        authorId: 'tutor',
        items: [],
        submit: false,
      }),
    ).rejects.toThrow(ForbiddenError);
    expect(repository.recordEvaluation).not.toHaveBeenCalled();
  });
  it('propagates business validation failures', async () => {
    repository.recordEvaluation.mockRejectedValue(
      new UnprocessableEntityError('Configuração inválida.'),
    );
    await expect(
      useCase.execute({
        sessionId: 'session',
        studentId: 'student',
        authorId: 'tutor',
        items: [],
        submit: false,
      }),
    ).rejects.toThrow(UnprocessableEntityError);
  });
});
