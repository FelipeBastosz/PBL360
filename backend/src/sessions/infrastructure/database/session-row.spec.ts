import { SESSION_COLUMNS } from './session-row';

describe('SESSION_COLUMNS', () => {
  it('selects session fields with the domain property aliases', () => {
    expect(SESSION_COLUMNS).toContain('problem_id AS "problemId"');
    expect(SESSION_COLUMNS).toContain('performance_table_id AS "performanceTableId"');
    expect(SESSION_COLUMNS).toContain('to_char(date,');
    expect(SESSION_COLUMNS).toContain('self_eval_released AS "selfEvalReleased"');
    expect(SESSION_COLUMNS).toContain('updated_at AS "updatedAt"');
  });
});
