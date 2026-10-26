import { EvaluationHistoryController } from './evaluation-history.controller';
import type { GetSessionEvaluationHistoryUseCase } from '../../application/use-cases/get-session-evaluation-history.use-case';
import type { GetStudentSessionEvaluationComparisonUseCase } from '../../application/use-cases/get-student-session-evaluation-comparison.use-case';
import {
  EvaluationAdjustmentSituation,
  type SessionEvaluationHistoryItem,
  type StudentSessionEvaluationComparison,
} from '../../domain/entities/evaluation-history.entity';

describe('EvaluationHistoryController', () => {
  let controller: EvaluationHistoryController;
  let getHistory: jest.Mocked<GetSessionEvaluationHistoryUseCase>;
  let getComparison: jest.Mocked<GetStudentSessionEvaluationComparisonUseCase>;

  const sessionId = 'session-123';
  const studentId = 'student-456';
  const tutorId = 'tutor-789';

  beforeEach(() => {
    getHistory = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetSessionEvaluationHistoryUseCase>;

    getComparison = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetStudentSessionEvaluationComparisonUseCase>;

    controller = new EvaluationHistoryController(getHistory, getComparison);
  });

  describe('list', () => {
    it('returns session evaluation history list mapped to DTO', async () => {
      const mockItems: SessionEvaluationHistoryItem[] = [
        {
          alunoId: studentId,
          nome: 'Ana Souza',
          matricula: '20240001',
          notaAluno: 9.0,
          notaAlunoOriginal: 8.5,
          notaTutor: 9.0,
          notaPares: 8.5,
          avaliacoesPares: 1,
          situacaoAjuste: EvaluationAdjustmentSituation.AJUSTADA,
        },
      ];

      getHistory.execute.mockResolvedValue(mockItems);

      const result = await controller.list(sessionId, tutorId);

      expect(getHistory.execute).toHaveBeenCalledWith(sessionId, tutorId);
      expect(result).toEqual({
        alunos: [
          {
            alunoId: studentId,
            nome: 'Ana Souza',
            matricula: '20240001',
            notaAluno: 9.0,
            notaAlunoOriginal: 8.5,
            notaTutor: 9.0,
            notaPares: 8.5,
            avaliacoesPares: 1,
            situacaoAjuste: EvaluationAdjustmentSituation.AJUSTADA,
          },
        ],
      });
    });
  });

  describe('get', () => {
    it('returns student evaluation comparison mapped to DTO', async () => {
      const now = new Date();
      const mockComparison: StudentSessionEvaluationComparison = {
        aluno: { alunoId: studentId, nome: 'Ana Souza' },
        autoavaliacao: {
          status: 'ENVIADA',
          enviadaEm: now,
          notaConsolidada: 8.5,
          itens: [
            {
              criterioId: 'crit-1',
              nome: 'Participação',
              notaAluno: 8.5,
              notaTutor: 9.0,
            },
          ],
        },
        pares: [
          {
            avaliadorId: 'student-2',
            avaliadorNome: 'João Silva',
            enviadaEm: now,
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
            ajustadoEm: now,
          },
        ],
      };

      getComparison.execute.mockResolvedValue(mockComparison);

      const result = await controller.get(sessionId, studentId, tutorId);

      expect(getComparison.execute).toHaveBeenCalledWith(sessionId, studentId, tutorId);
      expect(result).toEqual({
        aluno: { alunoId: studentId, nome: 'Ana Souza' },
        autoavaliacao: {
          status: 'ENVIADA',
          enviadaEm: now,
          notaConsolidada: 8.5,
          itens: [
            {
              criterioId: 'crit-1',
              nome: 'Participação',
              notaAluno: 8.5,
              notaTutor: 9.0,
            },
          ],
        },
        pares: [
          {
            avaliadorId: 'student-2',
            avaliadorNome: 'João Silva',
            enviadaEm: now,
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
            ajustadoEm: now,
          },
        ],
      });
    });
  });
});
