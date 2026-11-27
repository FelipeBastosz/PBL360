import {
  CREATE_OBSERVATION_QUERY,
  FIND_OBSERVATION_BY_ID_QUERY,
  FIND_STUDENT_SESSION_OBSERVATIONS_QUERY,
  REGISTRATION_CONTEXT_QUERY,
} from './observation.queries';

describe('observation SQL contracts', () => {
  it('checks enrollment and only exposes active tags usable by the tutor', () => {
    expect(REGISTRATION_CONTEXT_QUERY).toContain('studentEnrolled');
    expect(REGISTRATION_CONTEXT_QUERY).toContain('AND active');
    expect(REGISTRATION_CONTEXT_QUERY).toContain('(tutor_id IS NULL OR tutor_id = $3)');
  });

  it('creates observations and links tags in one query', () => {
    expect(CREATE_OBSERVATION_QUERY).toContain('WITH created AS');
    expect(CREATE_OBSERVATION_QUERY).toContain('unnest($5::uuid[])');
    expect(CREATE_OBSERVATION_QUERY).toContain('RETURNING id, created_at');
  });

  it('aggregates tags for a single observation and student session', () => {
    expect(FIND_OBSERVATION_BY_ID_QUERY).toContain('WHERE o.id = $1');
    expect(FIND_STUDENT_SESSION_OBSERVATIONS_QUERY).toContain(
      'WHERE o.session_id = $1 AND o.student_id = $2',
    );
    expect(FIND_STUDENT_SESSION_OBSERVATIONS_QUERY).toContain('ORDER BY o.created_at DESC');
  });
});
