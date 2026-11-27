import type { DataSource } from 'typeorm';
import { seedReviewEvaluationsIfEmpty } from './review-evaluations.seed';
import type { ReviewUsers } from './review-activities.seed';

const users = {
  tutor: { id: 'tutor-1' },
  coTutor: { id: 'tutor-2' },
  student1: { id: 'student-1' },
  student2: { id: 'student-2' },
} as ReviewUsers;

function createDataSource(
  options: {
    existing?: boolean;
    noSession?: boolean;
    noCriteria?: boolean;
    noSeedIds?: boolean;
  } = {},
) {
  let evaluationIndex = 0;
  const query = jest.fn((sql: string) => {
    if (sql.includes('SELECT id FROM evaluations')) {
      return Promise.resolve(options.existing ? [{ id: 'existing-evaluation' }] : []);
    }
    if (sql.includes('SELECT performance_table_id FROM sessions')) {
      return Promise.resolve(options.noSession ? [] : [{ performance_table_id: 'table-1' }]);
    }
    if (sql.includes('SELECT id FROM performance_criteria')) {
      return Promise.resolve(
        options.noCriteria ? [] : [{ id: 'criterion-1' }, { id: 'criterion-2' }],
      );
    }
    if (sql.includes('INSERT INTO evaluations')) {
      if (options.noSeedIds) return Promise.resolve([]);
      evaluationIndex += 1;
      return Promise.resolve([{ id: `evaluation-${evaluationIndex}` }]);
    }
    return Promise.resolve([]);
  });
  return { dataSource: { query } as unknown as DataSource, query };
}

describe('seedReviewEvaluationsIfEmpty', () => {
  it('does nothing when the session already has evaluations', async () => {
    const { dataSource, query } = createDataSource({ existing: true });
    await seedReviewEvaluationsIfEmpty(dataSource, 'problem-1', 'session-1', users);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('does nothing when no session or active criteria can be found', async () => {
    const noSession = createDataSource({ noSession: true });
    await seedReviewEvaluationsIfEmpty(noSession.dataSource, 'problem-1', 'session-1', users);
    expect(noSession.query).toHaveBeenCalledTimes(2);

    const noCriteria = createDataSource({ noCriteria: true });
    await seedReviewEvaluationsIfEmpty(noCriteria.dataSource, 'problem-1', 'session-1', users);
    expect(noCriteria.query).toHaveBeenCalledTimes(3);
  });

  it('creates snapshots, self and peer evaluations, items and an adjustment', async () => {
    const { dataSource, query } = createDataSource();
    await seedReviewEvaluationsIfEmpty(dataSource, 'problem-1', 'session-1', users);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO session_evaluation_configs'),
      ['session-1', 'tutor-1', 'table-1'],
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO session_evaluation_criteria'),
      ['session-1', 'table-1'],
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining('SELF_ASSESSMENT'), [
      'student-1',
      'problem-1',
      'session-1',
      'table-1',
      8.5,
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('PEER_ASSESSMENT'), [
      'student-2',
      'student-1',
      'problem-1',
      'session-1',
      'table-1',
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO evaluation_items'), [
      'evaluation-1',
      'criterion-1',
      8.5,
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO grade_adjustments'), [
      'evaluation-1',
      'tutor-1',
    ]);
  });

  it('skips evaluation items and adjustment when seed inserts return no ids', async () => {
    const { dataSource, query } = createDataSource({ noSeedIds: true });
    await seedReviewEvaluationsIfEmpty(dataSource, 'problem-1', 'session-1', users);

    expect(query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO evaluation_items'),
      expect.anything(),
    );
    expect(query).not.toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO grade_adjustments'),
      expect.anything(),
    );
  });
});
