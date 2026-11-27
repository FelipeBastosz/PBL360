import {
  INSERT_FIRST_VIEWS,
  MARK_SESSION_FEEDBACKS_READ,
  READ_PROBLEM_FEEDBACKS,
  READ_PROBLEM_SESSIONS,
  READ_SESSION_FEEDBACK,
} from './received-feedback.queries';

describe('received feedback SQL contracts', () => {
  it('only returns feedback eligible for the requesting student', () => {
    expect(READ_SESSION_FEEDBACK).toContain("f.escopo = 'SESSAO'");
    expect(READ_SESSION_FEEDBACK).toContain("e.status = 'SUBMITTED'");
    expect(READ_PROBLEM_FEEDBACKS).toContain("f.escopo = 'PROBLEMA'");
    expect(READ_PROBLEM_FEEDBACKS).toContain("f.escopo = 'ALUNO'");
    expect(READ_PROBLEM_FEEDBACKS).toContain('ORDER BY f.criado_em DESC');
    expect(READ_PROBLEM_SESSIONS).toContain('ORDER BY date ASC, order_index ASC');
  });

  it('records first views once and advances read timestamps monotonically', () => {
    expect(INSERT_FIRST_VIEWS).toContain('ON CONFLICT (feedback_id, student_id) DO NOTHING');
    expect(INSERT_FIRST_VIEWS).toContain('RETURNING feedback_id AS id');
    expect(MARK_SESSION_FEEDBACKS_READ).toContain(
      'GREATEST(student_session_feedback_reads.read_at, EXCLUDED.read_at)',
    );
  });
});
