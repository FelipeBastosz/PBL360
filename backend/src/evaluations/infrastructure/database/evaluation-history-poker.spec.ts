import type { DataSource, EntityManager } from 'typeorm';
import {
  EvaluationAdjustmentSituation,
  EvaluationHistoryOrigin,
} from '../../domain/entities/evaluation-history.entity';
import { PgEvaluationHistoryRepository } from './pg-evaluation-history.repository';
import { buildComparisonPlanningPoker } from './evaluation-history-poker.builder';
import type { PokerRoundHistoryRow } from './evaluation-history.types';

const decidedAt = new Date('2026-11-20T15:00:00Z');

const round = (overrides: Partial<PokerRoundHistoryRow> = {}): PokerRoundHistoryRow => ({
  id: 'round-1',
  studentId: 'student-1',
  roundNumber: 1,
  average: '7.50',
  finalGrade: '7.50',
  adjusted: false,
  justification: null,
  decidedAt,
  decidedById: 'tutor-1',
  decidedByName: 'Carlos Mendes',
  anonymous: false,
  currentGrade: null,
  adjustmentCount: 0,
  voteCount: 3,
  ...overrides,
});

const students = [
  { alunoId: 'student-1', nome: 'Ana Souza', matricula: '20240001' },
  { alunoId: 'student-2', nome: 'Bruno Lima', matricula: '20240002' },
  { alunoId: 'student-3', nome: 'Carla Dias', matricula: '20240003' },
];

function mockManager(pokerRounds: PokerRoundHistoryRow[], extra: Record<string, unknown[]> = {}) {
  return jest.fn((sql: string) => {
    if (sql.includes('FROM poker_rounds pr')) return Promise.resolve(pokerRounds);
    for (const [marker, rows] of Object.entries(extra)) {
      if (sql.includes(marker)) return Promise.resolve(rows);
    }
    if (sql.includes('SELECT u.id AS "alunoId"')) {
      return Promise.resolve(sql.includes('a.student_id = $2') ? [students[0]] : students);
    }
    if (sql.includes('FROM formulas f')) {
      return Promise.resolve([
        { type: 'CRITERIOS', weight: 70 },
        { type: 'PAPEL', weight: 30 },
      ]);
    }
    if (sql.includes('JOIN performance_tables pt')) return Promise.resolve([{ id: 'table-1' }]);
    if (sql.includes('FROM performance_criteria')) {
      return Promise.resolve([{ id: 'crit-1', name: 'Critério', weight: 1, orderIndex: 1 }]);
    }
    return Promise.resolve([]);
  });
}

function buildRepository(query: jest.Mock) {
  const manager = { query } as unknown as EntityManager;
  const dataSource = {
    manager,
    transaction: (_iso: string, cb: (m: EntityManager) => Promise<unknown>) => cb(manager),
  } as unknown as DataSource;
  return new PgEvaluationHistoryRepository(dataSource);
}

describe('Evaluation history with planning poker', () => {
  it('shows the decided poker grade without adjustment', async () => {
    const repository = buildRepository(mockManager([round()]));

    const [ana, bruno] = await repository.getHistory('session-1');

    expect(ana).toEqual({
      alunoId: 'student-1',
      nome: 'Ana Souza',
      matricula: '20240001',
      notaAluno: null,
      notaAlunoOriginal: null,
      notaTutor: null,
      notaPares: 7.5,
      avaliacoesPares: 3,
      situacaoAjuste: EvaluationAdjustmentSituation.SEM_AJUSTE,
      origem: EvaluationHistoryOrigin.PLANNING_POKER,
    });
    expect(bruno).toMatchObject({
      notaPares: null,
      situacaoAjuste: EvaluationAdjustmentSituation.SEM_AJUSTE,
      origem: null,
    });
  });

  it('uses the latest tutor adjustment and keeps the vote average as reference', async () => {
    const repository = buildRepository(
      mockManager([round({ currentGrade: '9.00', adjustmentCount: 2 })]),
    );

    const [ana] = await repository.getHistory('session-1');

    expect(ana).toMatchObject({
      notaAlunoOriginal: 7.5,
      notaPares: 9,
      situacaoAjuste: EvaluationAdjustmentSituation.AJUSTADA,
      origem: EvaluationHistoryOrigin.PLANNING_POKER,
    });
  });

  it('treats a grade readjusted at the poker table as adjusted', async () => {
    const repository = buildRepository(
      mockManager([
        round({ average: '6.00', finalGrade: '8.00', adjusted: true, justification: 'Revisada' }),
      ]),
    );

    const [ana] = await repository.getHistory('session-1');

    expect(ana).toMatchObject({
      notaAlunoOriginal: 6,
      notaPares: 8,
      situacaoAjuste: EvaluationAdjustmentSituation.AJUSTADA,
    });
  });

  it('keeps the true original peer grade after several peer adjustments', async () => {
    const repository = buildRepository(
      mockManager([], {
        "ga.type = 'PEER_ASSESSMENT'": [
          { studentId: 'student-2', previousValue: '8.50', originalValue: '7.60', newValue: '9' },
        ],
      }),
    );

    const [, bruno] = await repository.getHistory('session-1');

    expect(bruno).toMatchObject({
      notaAlunoOriginal: 7.6,
      notaPares: 9,
      situacaoAjuste: EvaluationAdjustmentSituation.AJUSTADA,
      origem: EvaluationHistoryOrigin.PARES,
    });
  });

  it('returns the poker round and its adjustments in the student detail', async () => {
    const adjustment = {
      previousValue: '7.50',
      newValue: '9.00',
      justification: 'Participação revista',
      authorId: 'tutor-1',
      authorName: 'Carlos Mendes',
      createdAt: decidedAt,
    };
    const query = mockManager([round({ currentGrade: '9.00', adjustmentCount: 1 })], {
      'FROM poker_votes pv': [
        { voterId: 'student-2', voterName: 'Bruno Lima', score: '7.00', votedAt: decidedAt },
        { voterId: 'student-3', voterName: 'Carla Dias', score: '8.00', votedAt: decidedAt },
      ],
      'WHERE ga.poker_round_id = $1': [adjustment],
    });

    const result = await buildRepository(query).getStudentComparison('session-1', 'student-1');

    expect(result!.planningPoker).toMatchObject({
      rodadaId: 'round-1',
      media: 7.5,
      notaDecidida: 7.5,
      notaVigente: 9,
      ajustadaNaMesa: false,
      decididaPor: { id: 'tutor-1', nome: 'Carlos Mendes' },
      votos: [
        { avaliadorId: 'student-2', avaliadorNome: 'Bruno Lima', nota: 7 },
        { avaliadorId: 'student-3', avaliadorNome: 'Carla Dias', nota: 8 },
      ],
    });
    expect(result!.ajustes).toEqual([
      {
        valorAnterior: 7.5,
        valorNovo: 9,
        justificativa: 'Participação revista',
        autor: { id: 'tutor-1', nome: 'Carlos Mendes' },
        ajustadoEm: decidedAt,
      },
    ]);
  });

  it('returns no poker data in the detail when the student has no decided round', async () => {
    const result = await buildRepository(mockManager([])).getStudentComparison(
      'session-1',
      'student-1',
    );

    expect(result!.planningPoker).toBeNull();
  });

  it('hides voter identities when the poker is anonymous', () => {
    const detail = buildComparisonPlanningPoker(round({ anonymous: true }), [
      { voterId: 'student-2', voterName: 'Bruno Lima', score: '7.00', votedAt: decidedAt },
    ]);

    expect(detail.votos).toEqual([{ avaliadorId: null, avaliadorNome: null, nota: 7 }]);
  });
});
