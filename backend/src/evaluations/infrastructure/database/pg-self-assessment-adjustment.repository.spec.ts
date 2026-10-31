import type { DataSource, EntityManager } from 'typeorm';
import { EvaluationStatus } from '../../domain/enums/evaluation-status.enum';
import { PgSelfAssessmentAdjustmentRepository } from './pg-self-assessment-adjustment.repository';
import {
  FIND_EVALUATION_ADJUSTMENTS,
  FIND_PEER_FORM_ADJUSTMENTS,
  FIND_PEER_FORM_SCORES,
  FIND_POKER_ADJUSTMENTS,
  FIND_POKER_ROUND_SCORE,
  FIND_SELF_ASSESSMENT_SCORE,
  FIND_SESSION_EVALUATION_RELEASES,
  INSERT_EVALUATION_ADJUSTMENT,
  INSERT_PEER_FORM_ADJUSTMENT,
  INSERT_POKER_ADJUSTMENT,
  LOCK_PEER_FORM_SCORES,
  LOCK_POKER_ROUND_SCORE,
  LOCK_SELF_ASSESSMENT_SCORE,
} from './self-assessment-adjustment.queries';

describe('PgSelfAssessmentAdjustmentRepository', () => {
  let repository: PgSelfAssessmentAdjustmentRepository;
  let manager: jest.Mocked<Pick<EntityManager, 'query'>>;
  let dataSource: DataSource;

  const sessionId = 'session-123';
  const studentId = 'student-456';
  const authorId = 'tutor-789';
  const createdAt = new Date('2026-10-20T10:00:00Z');

  beforeEach(() => {
    manager = { query: jest.fn() };
    dataSource = {
      transaction: jest.fn().mockImplementation((first: unknown, second?: unknown) => {
        const cb = typeof first === 'function' ? first : second;
        return (cb as (m: EntityManager) => Promise<unknown>)(manager as unknown as EntityManager);
      }),
    } as unknown as DataSource;

    repository = new PgSelfAssessmentAdjustmentRepository(dataSource);
  });

  describe('findHistory', () => {
    it('returns self-assessment history when modality is self-assessment', async () => {
      manager.query
        .mockResolvedValueOnce([{ selfEvalReleased: true, peerEvalReleased: false }])
        .mockResolvedValueOnce([
          { id: 'eval-1', status: EvaluationStatus.SUBMITTED, sessionScore: '8.50' },
        ])
        .mockResolvedValueOnce([
          {
            previousValue: '8.00',
            newValue: '8.50',
            justification: 'Boa argumentação',
            authorId,
            authorName: 'Tutor',
            createdAt,
          },
        ]);

      const result = await repository.findHistory(sessionId, studentId);

      expect(result).toEqual({
        evaluationId: 'eval-1',
        status: EvaluationStatus.SUBMITTED,
        originalScore: 8.5,
        tipo: 'AUTOAVALIACAO',
        adjustments: [
          {
            previousValue: 8,
            newValue: 8.5,
            justification: 'Boa argumentação',
            authorId,
            authorName: 'Tutor',
            createdAt,
          },
        ],
      });
      expect(manager.query).toHaveBeenCalledWith(FIND_SESSION_EVALUATION_RELEASES, [sessionId]);
      expect(manager.query).toHaveBeenCalledWith(FIND_SELF_ASSESSMENT_SCORE, [
        sessionId,
        studentId,
      ]);
      expect(manager.query).toHaveBeenCalledWith(FIND_EVALUATION_ADJUSTMENTS, ['eval-1']);
    });

    it('returns poker history when poker round exists in peer modality', async () => {
      manager.query
        .mockResolvedValueOnce([{ id: 'poker-1', status: 'DECIDED', sessionScore: '9.00' }])
        .mockResolvedValueOnce([
          {
            previousValue: '8.50',
            newValue: '9.00',
            justification: 'Ajuste pós poker',
            authorId,
            authorName: 'Tutor',
            createdAt,
          },
        ]);

      const result = await repository.findHistory(sessionId, studentId, 'PARES');

      expect(result).toEqual({
        pokerRoundId: 'poker-1',
        status: EvaluationStatus.SUBMITTED,
        originalScore: 9,
        tipo: 'PARES',
        adjustments: [
          {
            previousValue: 8.5,
            newValue: 9,
            justification: 'Ajuste pós poker',
            authorId,
            authorName: 'Tutor',
            createdAt,
          },
        ],
      });
      expect(manager.query).toHaveBeenCalledWith(FIND_POKER_ROUND_SCORE, [sessionId, studentId]);
      expect(manager.query).toHaveBeenCalledWith(FIND_POKER_ADJUSTMENTS, ['poker-1']);
    });

    it('returns draft for undecided poker round', async () => {
      manager.query.mockResolvedValueOnce([
        { id: 'poker-1', status: 'VOTING', sessionScore: null },
      ]);

      const result = await repository.findHistory(sessionId, studentId, 'PARES');

      expect(result).toEqual({
        status: EvaluationStatus.DRAFT,
        originalScore: null,
        adjustments: [],
        tipo: 'PARES',
      });
    });

    it('returns peer form history when poker round does not exist', async () => {
      manager.query
        .mockResolvedValueOnce([]) // no poker round
        .mockResolvedValueOnce([
          { id: 'peer-eval-1', status: EvaluationStatus.SUBMITTED, sessionScore: '8.00' },
          { id: 'peer-eval-2', status: EvaluationStatus.SUBMITTED, sessionScore: '9.00' },
        ])
        .mockResolvedValueOnce([{ selfEvalReleased: false, peerEvalReleased: false }])
        .mockResolvedValueOnce([
          {
            previousValue: '8.50',
            newValue: '9.00',
            justification: 'Ajuste consolidado pares',
            authorId,
            authorName: 'Tutor',
            createdAt,
          },
        ]);

      const result = await repository.findHistory(sessionId, studentId, 'PARES');

      expect(result).toEqual({
        sessionId,
        studentId,
        status: EvaluationStatus.SUBMITTED,
        originalScore: 8.5,
        tipo: 'PARES',
        adjustments: [
          {
            previousValue: 8.5,
            newValue: 9,
            justification: 'Ajuste consolidado pares',
            authorId,
            authorName: 'Tutor',
            createdAt,
          },
        ],
      });
      expect(manager.query).toHaveBeenCalledWith(FIND_PEER_FORM_SCORES, [sessionId, studentId]);
      expect(manager.query).toHaveBeenCalledWith(FIND_SESSION_EVALUATION_RELEASES, [sessionId]);
      expect(manager.query).toHaveBeenCalledWith(FIND_PEER_FORM_ADJUSTMENTS, [
        sessionId,
        studentId,
      ]);
    });

    it('returns draft for peer form when peer evaluation is still released', async () => {
      manager.query
        .mockResolvedValueOnce([]) // no poker round
        .mockResolvedValueOnce([
          { id: 'peer-eval-1', status: EvaluationStatus.SUBMITTED, sessionScore: '8.00' },
        ])
        .mockResolvedValueOnce([{ selfEvalReleased: false, peerEvalReleased: true }]);

      const result = await repository.findHistory(sessionId, studentId, 'PARES');

      expect(result).toEqual({
        sessionId,
        studentId,
        status: EvaluationStatus.DRAFT,
        originalScore: null,
        adjustments: [],
        tipo: 'PARES',
      });
    });

    it('returns draft when peer form evaluations exist but none submitted', async () => {
      manager.query
        .mockResolvedValueOnce([]) // no poker
        .mockResolvedValueOnce([
          { id: 'peer-eval-1', status: EvaluationStatus.DRAFT, sessionScore: null },
        ])
        .mockResolvedValueOnce([{ selfEvalReleased: false, peerEvalReleased: false }]);

      const result = await repository.findHistory(sessionId, studentId, 'PARES');

      expect(result).toEqual({
        sessionId,
        studentId,
        status: EvaluationStatus.DRAFT,
        originalScore: null,
        adjustments: [],
        tipo: 'PARES',
      });
    });

    it('returns null when no evaluation exists in peer mode', async () => {
      manager.query
        .mockResolvedValueOnce([]) // no poker
        .mockResolvedValueOnce([]); // no peer form

      const result = await repository.findHistory(sessionId, studentId, 'PARES');

      expect(result).toBeNull();
    });
  });

  describe('record', () => {
    it('records self-assessment adjustment using INSERT_EVALUATION_ADJUSTMENT', async () => {
      manager.query
        .mockResolvedValueOnce([{ selfEvalReleased: true, peerEvalReleased: false }])
        .mockResolvedValueOnce([
          { id: 'eval-1', status: EvaluationStatus.SUBMITTED, sessionScore: '8.00' },
        ])
        .mockResolvedValueOnce([]) // no previous adjustments
        .mockResolvedValueOnce([
          {
            previousValue: '8.00',
            newValue: '9.00',
            justification: 'Nota corrigida com justificativa válida',
            authorId,
            authorName: 'Tutor',
            createdAt,
          },
        ]);

      const result = await repository.record({
        sessionId,
        studentId,
        authorId,
        newScore: 9,
        justification: 'Nota corrigida com justificativa válida',
      });

      expect(result).toEqual({
        originalScore: 8,
        adjustment: {
          previousValue: 8,
          newValue: 9,
          justification: 'Nota corrigida com justificativa válida',
          authorId,
          authorName: 'Tutor',
          createdAt,
        },
      });
      expect(manager.query).toHaveBeenCalledWith(LOCK_SELF_ASSESSMENT_SCORE, [
        sessionId,
        studentId,
      ]);
      expect(manager.query).toHaveBeenCalledWith(INSERT_EVALUATION_ADJUSTMENT, [
        'eval-1',
        8,
        9,
        'Nota corrigida com justificativa válida',
        authorId,
      ]);
    });

    it('records poker adjustment using INSERT_POKER_ADJUSTMENT', async () => {
      manager.query
        .mockResolvedValueOnce([{ id: 'poker-1', status: 'DECIDED', sessionScore: '7.50' }])
        .mockResolvedValueOnce([]) // no previous adjustments
        .mockResolvedValueOnce([
          {
            previousValue: '7.50',
            newValue: '8.50',
            justification: 'Revisão da rodada de poker',
            authorId,
            authorName: 'Tutor',
            createdAt,
          },
        ]);

      const result = await repository.record({
        sessionId,
        studentId,
        authorId,
        newScore: 8.5,
        justification: 'Revisão da rodada de poker',
        tipo: 'PARES',
      });

      expect(result.originalScore).toBe(7.5);
      expect(result.adjustment.newValue).toBe(8.5);
      expect(manager.query).toHaveBeenCalledWith(LOCK_POKER_ROUND_SCORE, [sessionId, studentId]);
      expect(manager.query).toHaveBeenCalledWith(INSERT_POKER_ADJUSTMENT, [
        'poker-1',
        7.5,
        8.5,
        'Revisão da rodada de poker',
        authorId,
      ]);
    });

    it('records peer form adjustment using INSERT_PEER_FORM_ADJUSTMENT', async () => {
      manager.query
        .mockResolvedValueOnce([]) // no poker
        .mockResolvedValueOnce([
          { id: 'peer-1', status: EvaluationStatus.SUBMITTED, sessionScore: '8.00' },
          { id: 'peer-2', status: EvaluationStatus.SUBMITTED, sessionScore: '8.00' },
        ])
        .mockResolvedValueOnce([{ selfEvalReleased: false, peerEvalReleased: false }])
        .mockResolvedValueOnce([]) // no previous adjustments
        .mockResolvedValueOnce([
          {
            previousValue: '8.00',
            newValue: '9.50',
            justification: 'Revisão da média de pares',
            authorId,
            authorName: 'Tutor',
            createdAt,
          },
        ]);

      const result = await repository.record({
        sessionId,
        studentId,
        authorId,
        newScore: 9.5,
        justification: 'Revisão da média de pares',
        tipo: 'PARES',
      });

      expect(result.originalScore).toBe(8);
      expect(result.adjustment.newValue).toBe(9.5);
      expect(manager.query).toHaveBeenCalledWith(LOCK_PEER_FORM_SCORES, [sessionId, studentId]);
      expect(manager.query).toHaveBeenCalledWith(FIND_SESSION_EVALUATION_RELEASES, [sessionId]);
      expect(manager.query).toHaveBeenCalledWith(INSERT_PEER_FORM_ADJUSTMENT, [
        sessionId,
        studentId,
        8,
        9.5,
        'Revisão da média de pares',
        authorId,
      ]);
    });

    it('keeps originalScore fixed to the first adjustment previousValue even if rows change', async () => {
      manager.query
        .mockResolvedValueOnce([]) // no poker
        .mockResolvedValueOnce([
          // say peer scores changed or re-read
          { id: 'peer-1', status: EvaluationStatus.SUBMITTED, sessionScore: '6.00' },
        ])
        .mockResolvedValueOnce([{ selfEvalReleased: false, peerEvalReleased: false }])
        .mockResolvedValueOnce([
          // previous adjustments exist: first was previousValue 8.00 -> 9.00
          {
            previousValue: '8.00',
            newValue: '9.00',
            justification: 'Primeiro ajuste',
            authorId,
            authorName: 'Tutor',
            createdAt,
          },
        ]);

      const result = await repository.findHistory(sessionId, studentId, 'PARES');

      expect(result?.originalScore).toBe(8);
    });
  });
});
