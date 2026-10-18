import { GetStudentSessionEvaluationComparisonUseCase } from './get-student-session-evaluation-comparison.use-case';
import type { EvaluationAccessService } from '../services/evaluation-access.service';
import type { EvaluationHistoryRepository } from '../../domain/repositories/evaluation-history.repository';
import type { StudentSessionEvaluationComparison } from '../../domain/entities/evaluation-history.entity';
import { ForbiddenError, NotFoundError } from '@/shared/errors/application.error';

describe('GetStudentSessionEvaluationComparisonUseCase', () => {
  let useCase: GetStudentSessionEvaluationComparisonUseCase;
  let access: jest.Mocked<EvaluationAccessService>;
  let historyRepo: jest.Mocked<EvaluationHistoryRepository>;

  const sessionId = 'session-123';
  const studentId = 'student-456';
  const tutorId = 'tutor-789';

  beforeEach(() => {
    access = {
      forSession: jest.fn().mockResolvedValue({
        sessionId,
        problemId: 'problem-101',
        roomId: 'room-202',
      }),
      forStudent: jest.fn(),
    } as unknown as jest.Mocked<EvaluationAccessService>;

    historyRepo = {
      getHistory: jest.fn(),
      getStudentComparison: jest.fn(),
      isStudentParticipating: jest.fn(),
    };

    useCase = new GetStudentSessionEvaluationComparisonUseCase(access, historyRepo);
  });

  it('returns comparison details when student participated in session', async () => {
    const mockComparison: StudentSessionEvaluationComparison = {
      aluno: { alunoId: studentId, nome: 'Ana Souza' },
      autoavaliacao: {
        status: 'ENVIADA',
        enviadaEm: new Date('2026-10-01T12:00:00Z'),
        notaConsolidada: 8.5,
        itens: [{ criterioId: 'crit-1', nome: 'Participação', notaAluno: 8.5, notaTutor: 9.0 }],
      },
      pares: [
        {
          avaliadorId: 'student-2',
          avaliadorNome: 'João Silva',
          enviadaEm: new Date('2026-10-01T13:00:00Z'),
          notaConsolidada: 8.5,
          itens: [{ criterioId: 'crit-1', nota: 8.5 }],
        },
      ],
      ajustes: [
        {
          valorAnterior: 8.5,
          valorNovo: 9.0,
          justificativa: 'Participação ativa nas discussões',
          autor: { id: tutorId, nome: 'Carlos Mendes' },
          ajustadoEm: new Date('2026-10-01T14:00:00Z'),
        },
      ],
    };

    historyRepo.getStudentComparison.mockResolvedValue(mockComparison);

    const result = await useCase.execute(sessionId, studentId, tutorId);

    expect(access.forSession).toHaveBeenCalledWith(sessionId, tutorId);
    expect(historyRepo.getStudentComparison).toHaveBeenCalledWith(sessionId, studentId);
    expect(result).toEqual(mockComparison);
  });

  it('throws NotFoundError (404) when student did not participate in session', async () => {
    historyRepo.getStudentComparison.mockResolvedValue(null);

    await expect(useCase.execute(sessionId, studentId, tutorId)).rejects.toThrow(
      new NotFoundError('Aluno não participou da sessão.'),
    );
  });

  it('propagates ForbiddenError when tutor cannot access the room', async () => {
    access.forSession.mockRejectedValue(
      new ForbiddenError('Você não tem permissão para acessar ou modificar esta sala.'),
    );

    await expect(useCase.execute(sessionId, studentId, tutorId)).rejects.toThrow(
      'Você não tem permissão para acessar ou modificar esta sala.',
    );
    expect(historyRepo.getStudentComparison).not.toHaveBeenCalled();
  });

  it('propagates NotFoundError when session is not found', async () => {
    access.forSession.mockRejectedValue(new NotFoundError('Sessão não encontrada.'));

    await expect(useCase.execute(sessionId, studentId, tutorId)).rejects.toThrow(
      'Sessão não encontrada.',
    );
    expect(historyRepo.getStudentComparison).not.toHaveBeenCalled();
  });
});
