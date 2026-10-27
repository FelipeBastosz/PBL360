import { Test } from '@nestjs/testing';
import { ForbiddenError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { EvaluationAccessService } from '../services/evaluation-access.service';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository';
import { GetTutorEvaluationUseCase } from './get-tutor-evaluation.use-case';

const context = { sessionId: 'session', problemId: 'problem', roomId: 'room' };
describe('GetTutorEvaluationUseCase', () => {
  const access = { forStudent: jest.fn() };
  const repository = { get: jest.fn() };
  let useCase: GetTutorEvaluationUseCase;
  beforeEach(async () => {
    jest.resetAllMocks();
    access.forStudent.mockResolvedValue(context);
    const module = await Test.createTestingModule({
      providers: [
        GetTutorEvaluationUseCase,
        { provide: EvaluationAccessService, useValue: access },
        { provide: EVALUATION_REPOSITORY, useValue: repository },
      ],
    }).compile();
    useCase = module.get(GetTutorEvaluationUseCase);
  });
  it('checks access before reading or saving the evaluation', async () => {
    repository.get.mockResolvedValue({ result: true });
    await expect(useCase.execute('session', 'student', 'tutor')).resolves.toEqual({ result: true });
    expect(access.forStudent).toHaveBeenCalledWith('session', 'student', 'tutor');
    expect(repository.get).toHaveBeenCalledWith(context, 'student');
  });
  it('does not touch persistence when access is denied', async () => {
    access.forStudent.mockRejectedValue(new ForbiddenError('Acesso negado.'));
    await expect(useCase.execute('session', 'student', 'tutor')).rejects.toThrow(ForbiddenError);
    expect(repository.get).not.toHaveBeenCalled();
  });
  it('propagates business validation failures', async () => {
    repository.get.mockRejectedValue(new UnprocessableEntityError('Configuração inválida.'));
    await expect(useCase.execute('session', 'student', 'tutor')).rejects.toThrow(
      UnprocessableEntityError,
    );
  });
});
