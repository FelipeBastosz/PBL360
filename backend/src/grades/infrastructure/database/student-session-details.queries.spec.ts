import { FIND_PROBLEM_OBSERVATION_TAGS_QUERY } from './problem-observation-tags.queries';
import { FIND_STUDENT_SESSION_DETAILS_QUERY } from './student-session-details.queries';

describe('grade and observation summary SQL contracts', () => {
  it('groups observation tags by student and session while omitting untagged rows', () => {
    expect(FIND_PROBLEM_OBSERVATION_TAGS_QUERY).toContain('GROUP BY o.student_id, s.id');
    expect(FIND_PROBLEM_OBSERVATION_TAGS_QUERY).toContain('HAVING COUNT(t.id) > 0');
    expect(FIND_PROBLEM_OBSERVATION_TAGS_QUERY).toContain('ORDER BY s.order_index ASC NULLS LAST');
  });

  it('returns attendance and aggregated marks for each requested problem session', () => {
    expect(FIND_STUDENT_SESSION_DETAILS_QUERY).toContain(
      'a.session_id = s.id AND a.student_id = $2',
    );
    expect(FIND_STUDENT_SESSION_DETAILS_QUERY).toContain(
      "json_build_object('id', counts.id, 'name', counts.name, 'quantity', counts.quantity)",
    );
    expect(FIND_STUDENT_SESSION_DETAILS_QUERY).toContain('p.id = ANY($3::uuid[])');
  });
});
