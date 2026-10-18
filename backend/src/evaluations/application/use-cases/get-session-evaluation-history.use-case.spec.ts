import { GetSessionEvaluationHistoryUseCase } from './get-session-evaluation-history.use-case';
import type { EvaluationAccessService } from '../services/evaluation-access.service';
import type { EvaluationHistoryRepository } from '../../domain/repositories/evaluation-history.repository';
import {
  EvaluationAdjustmentSituation,
  type SessionEvaluationHistoryItem,
} from '../../domain/entities/evaluation-history.entity';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

describe('GetSessionEvaluationHistoryUseCase', () => {
  let useCase: GetSessionEvaluationHistoryUseCase;
  let access: jest.Mocked<EvaluationAccessService>;
  let historyRepo: jest.Mocked<EvaluationHistoryRepository>;

  const sessionId = 'session-123';
  const tutorId = 'tutor-456';

  beforeEach(() => {
    access = {
      forSession: jest.fn().mockResolvedValue({
        sessionId,
        problemId: 'problem-789',
        roomId: 'room-101',
      }),
      forStudent: jest.fn(),
    } as unknown as jest.Mocked<EvaluationAccessService>;

    historyRepo = {
      getHistory: jest.fn(),
      getStudentComparison: jest.fn(),
      isStudentParticipating: jest.fn(),
    };

    useCase = new GetSessionEvaluationHistoryUseCase(access, historyRepo);
  });

  it('delegates to access service and returns history from repository', async () => {
    const mockItems: SessionEvaluationHistoryItem[] = [
      {
        alunoId: 'student-1',
        nome: 'Ana Souza',
        matricula: '20240001',
        notaAluno: 9.0,
        notaAlunoOriginal: 8.5,
        notaTutor: 9.0,
        notaPares: 8.5,
        avaliacoesPares: 1,
        situacaoAjuste: EvaluationAdjustmentSituation.AJUSTADA,
      },
      {
        alunoId: 'student-2',
        nome: 'João Silva',
        matricula: '20240002',
        notaAluno: 8.0,
        notaAlunoOriginal: null,
        notaTutor: 8.5,
        notaPares: 8.5,
        avaliacoesPares: 1,
        situacaoAjuste: EvaluationAdjustmentSituation.SEM_AJUSTE,
      },
    ];

    historyRepo.getHistory.mockResolvedValue(mockItems);

    const result = await useCase.execute(sessionId, tutorId);

    expect(access.forSession).toHaveBeenCalledWith(sessionId, tutorId);
    expect(historyRepo.getHistory).toHaveBeenCalledWith(sessionId);
    expect(result).toEqual(mockItems);
  });

  it('propagates ForbiddenError when tutor has no access to room', async () => {
    access.forSession.mockRejectedValue(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(useCase.execute(sessionId, tutorId)).rejects.toThrow(
      'Você não tem permissão para acessar ou modificar esta sala.',
    );
    expect(historyRepo.getHistory).not.toHaveBeenCalled();
  });

  it('propagates NotFoundError when session is not found', async () => {
    access.forSession.mockRejectedValue(new NotFoundError('Sessão não encontrada.'));

    await expect(useCase.execute(sessionId, tutorId)).rejects.toThrow('Sessão não encontrada.');
    expect(historyRepo.getHistory).not.toHaveBeenCalled();
  });
});
