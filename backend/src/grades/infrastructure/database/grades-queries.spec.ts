import { buildProblemQueries, PROBLEM_FEEDBACKS_QUERY } from './grades-queries';

describe('problem grade queries', () => {
  it('builds all grade reads with the appropriate problem and room identifiers', () => {
    const queries = buildProblemQueries('room-1', 'problem-1');
    expect(queries).toHaveLength(13);
    expect(queries.map(({ params }, index) => [index, params])).toContainEqual([1, ['room-1']]);
    expect(
      queries.filter((_, index) => index !== 1).every(({ params }) => params[0] === 'problem-1'),
    ).toBe(true);
    expect(queries[0]?.sql).toContain('self_eval_deadline_ms');
    expect(queries[6]?.sql).toContain('session_evaluation_criteria');
    expect(PROBLEM_FEEDBACKS_QUERY).toContain('scope, nota AS grade');
  });
});
