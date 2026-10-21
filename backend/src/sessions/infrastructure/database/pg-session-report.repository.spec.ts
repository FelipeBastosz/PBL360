import type { DataSource, EntityManager } from 'typeorm';
import { EvaluationStatus } from '@/evaluations/domain/enums/evaluation-status.enum';
import { PgSessionReportRepository } from './pg-session-report.repository';
import {
  FIND_ROOM_STUDENTS_QUERY,
  FIND_SESSION_ATTENDANCES_QUERY,
  FIND_SESSION_EVALUATION_ITEMS_QUERY,
  FIND_SESSION_EVALUATIONS_QUERY,
  FIND_SESSION_FEEDBACKS_QUERY,
  FIND_SESSION_FORMULA_COMPONENTS_QUERY,
  FIND_SESSION_HEADER_QUERY,
  FIND_SESSION_OBSERVATION_TAGS_QUERY,
  FIND_SESSION_ROLES_QUERY,
  FIND_SNAPSHOT_CRITERIA_QUERY,
  FIND_TABLE_CRITERIA_QUERY,
} from './session-report.queries';

describe('PgSessionReportRepository', () => {
  let repository: PgSessionReportRepository;
  let manager: jest.Mocked<EntityManager>;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    manager = {
      query: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          (isolationOrCb: unknown, maybeCb?: (em: EntityManager) => Promise<unknown>) => {
            const cb =
              typeof isolationOrCb === 'function'
                ? (isolationOrCb as (em: EntityManager) => Promise<unknown>)
                : maybeCb;
            return cb ? cb(manager) : Promise.resolve(null);
          },
        ),
    } as unknown as jest.Mocked<DataSource>;

    repository = new PgSessionReportRepository(dataSource);
  });

  it('queries all session report data and maps students, attendances, roles, tags, evals and feedbacks', async () => {
    manager.query.mockImplementation(async (query: string) => {
      await Promise.resolve();
      if (query === FIND_SESSION_HEADER_QUERY) {
        return [
          {
            sessionId: 'sess-1',
            sessionTitle: 'Abertura',
            sessionOrderIndex: 1,
            sessionDate: '2026-10-14',
            problemId: 'prob-1',
            problemTitle: 'Dor torácica',
            problemOrderIndex: 1,
            roomId: 'room-1',
            roomName: 'Turma A',
            courseCode: 'MED01',
            semester: '2026.2',
          },
        ];
      }
      if (query === FIND_ROOM_STUDENTS_QUERY) {
        return [
          { studentId: 'stud-1', name: 'Ana Souza', matricula: '2026001' },
          { studentId: 'stud-2', name: 'Bruno Lima', matricula: '2026002' },
        ];
      }
      if (query === FIND_SESSION_ATTENDANCES_QUERY) {
        return [
          { studentId: 'stud-1', status: 'PRESENT' },
          { studentId: 'stud-2', status: 'LATE' },
        ];
      }
      if (query === FIND_SESSION_ROLES_QUERY) {
        return [{ studentId: 'stud-1', role: 'COORDINATOR', roleScore: '9.00' }];
      }
      if (query === FIND_SESSION_OBSERVATION_TAGS_QUERY) {
        return [{ studentId: 'stud-1', tags: ['Pontual', 'Participativo'] }];
      }
      if (query === FIND_SNAPSHOT_CRITERIA_QUERY) {
        return [
          { id: 'crit-1', name: 'Participação', weight: '4.00' },
          { id: 'crit-2', name: 'Fundamentação', weight: '6.00' },
        ];
      }
      if (query === FIND_SESSION_FORMULA_COMPONENTS_QUERY) {
        return [
          { type: 'CRITERIOS', weight: '70' },
          { type: 'PAPEL', weight: '30' },
        ];
      }
      if (query === FIND_SESSION_EVALUATIONS_QUERY) {
        return [
          {
            id: 'eval-1',
            studentId: 'stud-1',
            status: EvaluationStatus.SUBMITTED,
            sessionScore: '8.70',
            appliedBonus: '9.00',
          },
          {
            id: 'eval-2',
            studentId: 'stud-2',
            status: EvaluationStatus.DRAFT,
            sessionScore: null,
            appliedBonus: null,
          },
        ];
      }
      if (query === FIND_SESSION_EVALUATION_ITEMS_QUERY) {
        return [
          { evaluationId: 'eval-1', criterionId: 'crit-1', score: '8.00' },
          { evaluationId: 'eval-1', criterionId: 'crit-2', score: '9.00' },
          { evaluationId: 'eval-2', criterionId: 'crit-1', score: '7.00' },
        ];
      }
      if (query === FIND_SESSION_FEEDBACKS_QUERY) {
        return [
          {
            id: 'fb-1',
            recipientId: 'stud-1',
            text: 'Excelente participação.',
            authorName: 'Prof. Carlos',
          },
          {
            id: 'fb-gen',
            recipientId: null,
            text: 'Feedback geral da sessão.',
            authorName: 'Prof. Carlos',
          },
        ];
      }
      return [];
    });

    const data = await repository.getSessionReportData('sess-1', 'room-1');

    expect(data.room.name).toBe('Turma A');
    expect(data.problem.title).toBe('Dor torácica');
    expect(data.session.title).toBe('Abertura');
    expect(data.criteria).toEqual([
      { id: 'crit-1', name: 'Participação', weight: 4 },
      { id: 'crit-2', name: 'Fundamentação', weight: 6 },
    ]);
    expect(data.formula).toEqual({ criteriaWeight: 70, roleWeight: 30 });
    expect(data.generalFeedback).toEqual({
      text: 'Feedback geral da sessão.',
      authorName: 'Prof. Carlos',
    });

    expect(data.students).toHaveLength(2);

    const stud1 = data.students[0]!;
    expect(stud1.name).toBe('Ana Souza');
    expect(stud1.matricula).toBe('2026001');
    expect(stud1.attendanceStatus).toBe('PRESENT');
    expect(stud1.role).toBe('COORDINATOR');
    expect(stud1.roleScore).toBe(9.0);
    expect(stud1.tags).toEqual(['Pontual', 'Participativo']);
    expect(stud1.evaluationStatus).toBe(EvaluationStatus.SUBMITTED);
    expect(stud1.appliedBonus).toBe(9.0);
    expect(stud1.items).toEqual([
      { criterionId: 'crit-1', score: 8 },
      { criterionId: 'crit-2', score: 9 },
    ]);
    expect(stud1.feedback).toEqual({
      text: 'Excelente participação.',
      authorName: 'Prof. Carlos',
    });

    const stud2 = data.students[1]!;
    expect(stud2.name).toBe('Bruno Lima');
    expect(stud2.attendanceStatus).toBe('LATE');
    expect(stud2.role).toBeNull();
    expect(stud2.roleScore).toBeNull();
    expect(stud2.tags).toEqual([]);
    expect(stud2.evaluationStatus).toBe(EvaluationStatus.DRAFT);
    expect(stud2.feedback).toBeNull();
  });

  it('falls back to table criteria when snapshot criteria do not exist', async () => {
    manager.query.mockImplementation(async (query: string) => {
      await Promise.resolve();
      if (query === FIND_SESSION_HEADER_QUERY) {
        return [
          {
            sessionId: 'sess-1',
            sessionTitle: 'Abertura',
            sessionOrderIndex: 1,
            sessionDate: '2026-10-14',
            problemId: 'prob-1',
            problemTitle: 'Dor torácica',
            problemOrderIndex: 1,
            roomId: 'room-1',
            roomName: 'Turma A',
            courseCode: 'MED01',
            semester: '2026.2',
          },
        ];
      }
      if (query === FIND_ROOM_STUDENTS_QUERY) return [];
      if (query === FIND_SNAPSHOT_CRITERIA_QUERY) return []; // Empty snapshot
      if (query === FIND_TABLE_CRITERIA_QUERY) {
        return [{ id: 'pc-1', name: 'Critério da tabela', weight: '10.00' }];
      }
      if (query === FIND_SESSION_FORMULA_COMPONENTS_QUERY) return []; // Default formula fallback
      return [];
    });

    const data = await repository.getSessionReportData('sess-1', 'room-1');

    expect(data.criteria).toEqual([{ id: 'pc-1', name: 'Critério da tabela', weight: 10 }]);
    expect(data.formula).toEqual({ criteriaWeight: 70, roleWeight: 30 });
    expect(data.students).toEqual([]);
    expect(data.generalFeedback).toBeNull();
  });
});
