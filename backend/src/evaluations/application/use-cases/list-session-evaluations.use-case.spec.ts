import { Test } from '@nestjs/testing';
import { ForbiddenError, UnprocessableEntityError } from '@/shared/errors/application.error';
import { EvaluationAccessService } from '../services/evaluation-access.service';
import { EVALUATION_REPOSITORY } from '../../domain/repositories/evaluation.repository';
import { ListSessionEvaluationsUseCase } from './list-session-evaluations.use-case';

const context = { sessionId: 'session', problemId: 'problem', roomId: 'room' };
describe('ListSessionEvaluationsUseCase', () => {
  const access = { forSession: jest.fn() };
  const repository = { list: jest.fn() };
  let useCase: ListSessionEvaluationsUseCase;
  beforeEach(async () => {
    jest.resetAllMocks();
    access.forSession.mockResolvedValue(context);
    const module = await Test.createTestingModule({
      providers: [
        ListSessionEvaluationsUseCase,
        { provide: EvaluationAccessService, useValue: access },
        { provide: EVALUATION_REPOSITORY, useValue: repository },
      ],
    }).compile();
    useCase = module.get(ListSessionEvaluationsUseCase);
  });
  it('checks access before reading or saving the evaluation', async () => {
    repository.list.mockResolvedValue({ result: true });
    await expect(useCase.execute('session', 'tutor')).resolves.toEqual({ result: true });
    expect(access.forSession).toHaveBeenCalledWith('session', 'tutor');
    expect(repository.list).toHaveBeenCalledWith(context);
  });
  it('does not touch persistence when access is denied', async () => {
    access.forSession.mockRejectedValue(new ForbiddenError('Acesso negado.'));
    await expect(useCase.execute('session', 'tutor')).rejects.toThrow(ForbiddenError);
    expect(repository.list).not.toHaveBeenCalled();
  });
  it('propagates business validation failures', async () => {
    repository.list.mockRejectedValue(new UnprocessableEntityError('Configuração inválida.'));
    await expect(useCase.execute('session', 'tutor')).rejects.toThrow(UnprocessableEntityError);
  });
});
