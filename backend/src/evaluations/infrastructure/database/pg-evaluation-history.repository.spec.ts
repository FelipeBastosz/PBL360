import type { DataSource, EntityManager } from 'typeorm';
import { PgEvaluationHistoryRepository } from './pg-evaluation-history.repository';
import { EvaluationAdjustmentSituation } from '../../domain/entities/evaluation-history.entity';

describe('PgEvaluationHistoryRepository', () => {
  let repository: PgEvaluationHistoryRepository;
  let dataSource: jest.Mocked<Pick<DataSource, 'query' | 'transaction'>>;
  let manager: jest.Mocked<Pick<EntityManager, 'query'>>;

  const sessionId = 'session-123';
  const studentId = 'student-1';

  beforeEach(() => {
    manager = {
      query: jest.fn(),
    };

    dataSource = {
      manager: manager as unknown as EntityManager,
      query: jest.fn(),
      transaction: jest
        .fn()
        .mockImplementation((_iso: string, cb: (m: EntityManager) => Promise<unknown>) => {
          return cb(manager as unknown as EntityManager);
        }),
    } as unknown as jest.Mocked<Pick<DataSource, 'manager' | 'query' | 'transaction'>>;

    repository = new PgEvaluationHistoryRepository(dataSource as unknown as DataSource);
  });

  describe('isStudentParticipating', () => {
    it('returns true when attendance query returns exists=true', async () => {
      manager.query.mockResolvedValue([{ exists: true }]);

      const result = await repository.isStudentParticipating(sessionId, studentId);

      expect(manager.query).toHaveBeenCalledWith(expect.stringContaining('SELECT EXISTS'), [
        sessionId,
        studentId,
      ]);
      expect(result).toBe(true);
    });

    it('returns false when attendance query returns exists=false', async () => {
      manager.query.mockResolvedValue([{ exists: false }]);

      const result = await repository.isStudentParticipating(sessionId, studentId);

      expect(result).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('returns empty array when no students participated in the session', async () => {
      manager.query.mockResolvedValueOnce([]);

      const result = await repository.getHistory(sessionId);

      expect(result).toEqual([]);
    });

    it('builds history list with self, peer, and tutor comparison', async () => {
      manager.query.mockImplementation((sql: string) => {
        if (sql.includes('SELECT u.id AS "alunoId"')) {
          return Promise.resolve([
            { alunoId: 'student-1', nome: 'Ana Beatriz Souza', matricula: '20240001' },
            { alunoId: 'student-2', nome: 'João Silva', matricula: '20240002' },
            { alunoId: 'student-3', nome: 'Carlos', matricula: null },
          ]);
        }
        if (sql.includes('FROM session_evaluation_configs')) {
          return Promise.resolve([]);
        }
        if (sql.includes('FROM sessions s') && sql.includes('JOIN performance_tables pt')) {
          return Promise.resolve([{ id: 'table-1', name: 'Barema PBL' }]);
        }
        if (sql.includes('FROM performance_criteria')) {
          return Promise.resolve([
            { id: 'crit-1', name: 'Critério 1', weight: 6, orderIndex: 1 },
            { id: 'crit-2', name: 'Critério 2', weight: 4, orderIndex: 2 },
          ]);
        }
        if (sql.includes('FROM formulas f')) {
          return Promise.resolve([
            { type: 'CRITERIOS', weight: 70 },
            { type: 'PAPEL', weight: 30 },
          ]);
        }
        if (sql.includes("type = 'SELF_ASSESSMENT'") && sql.includes('SELECT id, student_id')) {
          return Promise.resolve([
            { id: 'self-1', studentId: 'student-1', status: 'SUBMITTED', sessionScore: '8.50' },
            { id: 'self-2', studentId: 'student-2', status: 'SUBMITTED', sessionScore: '7.00' },
            { id: 'self-3', studentId: 'student-3', status: 'DRAFT', sessionScore: null },
          ]);
        }
        if (sql.includes('FROM grade_adjustments ga')) {
          return Promise.resolve([{ evaluationId: 'self-1', newValue: '9.00' }]);
        }
        if (sql.includes("type = 'PEER_ASSESSMENT'")) {
          return Promise.resolve([
            { studentId: 'student-1', sessionScore: '8.00' },
            { studentId: 'student-1', sessionScore: '9.00' },
          ]);
        }
        if (sql.includes("type = 'TUTOR_SESSION'") || sql.includes('FROM criterion_grades')) {
          return Promise.resolve([
            { studentId: 'student-1', criterionId: 'crit-1', score: '10.00' },
            { studentId: 'student-1', criterionId: 'crit-2', score: '8.00' },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await repository.getHistory(sessionId);

      expect(result).toHaveLength(3);

      expect(result[0]).toEqual({
        alunoId: 'student-1',
        nome: 'Ana Beatriz Souza',
        matricula: '20240001',
        notaAluno: 9.0,
        notaAlunoOriginal: 8.5,
        notaTutor: 9.2,
        notaPares: 8.5,
        avaliacoesPares: 2,
        situacaoAjuste: EvaluationAdjustmentSituation.AJUSTADA,
      });

      expect(result[1]).toEqual({
        alunoId: 'student-2',
        nome: 'João Silva',
        matricula: '20240002',
        notaAluno: 7.0,
        notaAlunoOriginal: null,
        notaTutor: null,
        notaPares: null,
        avaliacoesPares: 0,
        situacaoAjuste: EvaluationAdjustmentSituation.SEM_AJUSTE,
      });

      expect(result[2]).toEqual({
        alunoId: 'student-3',
        nome: 'Carlos',
        matricula: null,
        notaAluno: null,
        notaAlunoOriginal: null,
        notaTutor: null,
        notaPares: null,
        avaliacoesPares: 0,
        situacaoAjuste: EvaluationAdjustmentSituation.SEM_AJUSTE,
      });
    });
  });

  describe('getStudentComparison', () => {
    it('returns null when student did not participate in the session', async () => {
      manager.query.mockResolvedValueOnce([]); // no student found in attendance

      const result = await repository.getStudentComparison(sessionId, studentId);

      expect(result).toBe(null);
    });

    it('returns full comparison details when student participated', async () => {
      const now = new Date('2026-10-01T14:00:00Z');

      manager.query.mockImplementation((sql: string) => {
        if (sql.includes('SELECT u.id AS "alunoId"') && sql.includes('a.student_id = $2')) {
          return Promise.resolve([
            { alunoId: studentId, nome: 'Ana Souza', matricula: '20240001' },
          ]);
        }
        if (sql.includes('SELECT self_eval_released')) {
          return Promise.resolve([
            { selfEvalReleased: true, selfEvalDeadline: new Date('2026-10-05T00:00:00Z') },
          ]);
        }
        if (sql.includes('FROM session_evaluation_configs')) {
          return Promise.resolve([]);
        }
        if (sql.includes('FROM sessions s') && sql.includes('JOIN performance_tables pt')) {
          return Promise.resolve([{ id: 'table-1', name: 'Barema PBL' }]);
        }
        if (sql.includes('FROM performance_criteria')) {
          return Promise.resolve([
            { id: 'crit-1', name: 'Critério 1', weight: 5, orderIndex: 1 },
            { id: 'crit-2', name: 'Critério 2', weight: 5, orderIndex: 2 },
          ]);
        }
        if (sql.includes('FROM formulas f')) {
          return Promise.resolve([
            { type: 'CRITERIOS', weight: 70 },
            { type: 'PAPEL', weight: 30 },
          ]);
        }
        if (sql.includes("type = 'SELF_ASSESSMENT'") && sql.includes('session_score')) {
          return Promise.resolve([
            {
              id: 'self-1',
              studentId,
              status: 'SUBMITTED',
              submittedAt: now,
              sessionScore: '8.50',
            },
          ]);
        }
        if (sql.includes('FROM evaluation_items WHERE evaluation_id = $1')) {
          return Promise.resolve([
            { criterionId: 'crit-1', score: '8.00' },
            { criterionId: 'crit-2', score: '9.00' },
          ]);
        }
        if (sql.includes('FROM grade_adjustments ga')) {
          return Promise.resolve([
            {
              previousValue: '8.50',
              newValue: '9.00',
              justification: 'Ajuste devido a liderança',
              authorId: 'tutor-1',
              authorName: 'Carlos Mendes',
              createdAt: now,
            },
          ]);
        }
        if (sql.includes("type = 'TUTOR_SESSION'") || sql.includes('FROM criterion_grades')) {
          return Promise.resolve([
            { criterionId: 'crit-1', score: '9.50' },
            { criterionId: 'crit-2', score: '8.50' },
          ]);
        }
        if (sql.includes("type = 'PEER_ASSESSMENT'") && sql.includes('e.student_id = $2')) {
          return Promise.resolve([
            {
              id: 'peer-1',
              avaliadorId: 'student-2',
              avaliadorNome: 'João Silva',
              enviadaEm: now,
              notaConsolidada: '8.50',
            },
          ]);
        }
        if (sql.includes('WHERE evaluation_id = ANY($1)')) {
          return Promise.resolve([
            { evaluationId: 'peer-1', criterionId: 'crit-1', score: '8.50' },
            { evaluationId: 'peer-1', criterionId: 'crit-2', score: '8.50' },
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await repository.getStudentComparison(sessionId, studentId);

      expect(result).not.toBeNull();
      expect(result!.aluno).toEqual({
        alunoId: studentId,
        nome: 'Ana Souza',
      });
      expect(result!.autoavaliacao).toEqual({
        status: 'ENVIADA',
        enviadaEm: now,
        notaConsolidada: 8.5,
        itens: [
          { criterioId: 'crit-1', nome: 'Critério 1', notaAluno: 8.0, notaTutor: 9.5 },
          { criterioId: 'crit-2', nome: 'Critério 2', notaAluno: 9.0, notaTutor: 8.5 },
        ],
      });
      expect(result!.pares).toEqual([
        {
          avaliadorId: 'student-2',
          avaliadorNome: 'João Silva',
          enviadaEm: now,
          notaConsolidada: 8.5,
          itens: [
            { criterioId: 'crit-1', nota: 8.5 },
            { criterioId: 'crit-2', nota: 8.5 },
          ],
        },
      ]);
      expect(result!.ajustes).toEqual([
        {
          valorAnterior: 8.5,
          valorNovo: 9.0,
          justificativa: 'Ajuste devido a liderança',
          autor: { id: 'tutor-1', nome: 'Carlos Mendes' },
          ajustadoEm: now,
        },
      ]);
    });
  });
});
