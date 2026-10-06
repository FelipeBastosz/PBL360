import { Test } from '@nestjs/testing';
import { ForbiddenError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { SessionAccessService } from '@/sessions/application/services/session-access.service';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository';
import { GetProblemEvaluationCriteriaUseCase } from './get-problem-evaluation-criteria.use-case';

describe('GetProblemEvaluationCriteriaUseCase', () => {
  const access = { assertTutorCanAccessProblem: jest.fn() };
  const repository = { getProblemCriteria: jest.fn() };
  let useCase: GetProblemEvaluationCriteriaUseCase;
  beforeEach(async () => {
    jest.resetAllMocks();
    access.assertTutorCanAccessProblem.mockResolvedValue(undefined);
    const module = await Test.createTestingModule({
      providers: [
        GetProblemEvaluationCriteriaUseCase,
        { provide: SessionAccessService, useValue: access },
        { provide: EVALUATION_REPOSITORY, useValue: repository },
      ],
    }).compile();
    useCase = module.get(GetProblemEvaluationCriteriaUseCase);
  });
  it('checks access before reading or saving the evaluation', async () => {
    repository.getProblemCriteria.mockResolvedValue({ result: true });
    await expect(useCase.execute('room', 'problem', 'tutor')).resolves.toEqual({ result: true });
    expect(access.assertTutorCanAccessProblem).toHaveBeenCalledWith('room', 'problem', 'tutor');
    expect(repository.getProblemCriteria).toHaveBeenCalledWith('problem');
  });
  it('does not touch persistence when access is denied', async () => {
    access.assertTutorCanAccessProblem.mockRejectedValue(new ForbiddenError('Acesso negado.'));
    await expect(useCase.execute('room', 'problem', 'tutor')).rejects.toThrow(ForbiddenError);
    expect(repository.getProblemCriteria).not.toHaveBeenCalled();
  });
  it('propagates business validation failures', async () => {
    repository.getProblemCriteria.mockRejectedValue(
      new UnprocessableEntityError('Configuração inválida.'),
    );
    await expect(useCase.execute('room', 'problem', 'tutor')).rejects.toThrow(
      UnprocessableEntityError,
    );
  });
});
