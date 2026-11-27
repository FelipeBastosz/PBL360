import {
  FIND_ADJUSTMENTS,
  FIND_EVALUATION,
  FIND_ITEMS,
  FIND_SELF_EVALUATION,
  LIST_EVALUATIONS,
  UPDATE_EVALUATION,
} from './evaluation.queries';
import {
  INSERT_SELF_EVALUATION,
  STUDENT_EVALUATION_COUNTS,
  UPDATE_SELF_DRAFT,
  UPDATE_SELF_SUBMISSION,
} from './self-assessment.queries';
import {
  FIND_PEER_EVALUATION,
  FIND_PEER_ITEMS,
  FIND_PEER_STUDENT,
  INSERT_INITIAL_PEER_EVALUATION,
  IS_STUDENT_PARTICIPATING,
  LIST_SESSION_PEERS,
  UPDATE_PEER_DRAFT,
  UPDATE_PEER_SUBMISSION,
} from './peer-evaluation.queries';

describe('evaluation SQL contracts', () => {
  it('uses the expected evaluation identities, child rows and update fields', () => {
    expect(FIND_EVALUATION).toContain("type = 'TUTOR_SESSION'");
    expect(FIND_EVALUATION).toContain('session_id = $1 AND student_id = $2');
    expect(FIND_ITEMS).toContain('WHERE evaluation_id = $1 ORDER BY criterion_id');
    expect(FIND_ADJUSTMENTS).toContain('JOIN users u ON u.id = ga.created_by');
    expect(LIST_EVALUATIONS).toContain('LEFT JOIN LATERAL');
    expect(UPDATE_EVALUATION).toContain('calculation_version = $6');
  });

  it('limits peer evaluations to participating students and unique evaluator targets', () => {
    expect(IS_STUDENT_PARTICIPATING).toContain("status IN ('PRESENT', 'LATE')");
    expect(LIST_SESSION_PEERS).toContain('a.student_id <> $2');
    expect(FIND_PEER_STUDENT).toContain("u.type = 'STUDENT'");
    expect(FIND_PEER_EVALUATION).toContain('evaluator_id = $2 AND student_id = $3');
    expect(FIND_PEER_ITEMS).toContain('ORDER BY criterion_id');
    expect(INSERT_INITIAL_PEER_EVALUATION).toContain('DO NOTHING');
    expect(UPDATE_PEER_SUBMISSION).toContain("status = 'SUBMITTED'");
    expect(UPDATE_PEER_DRAFT).toContain('applied_bonus = $1');
  });

  it('checks self-assessment eligibility, counts peers and stores submissions', () => {
    expect(STUDENT_EVALUATION_COUNTS).toContain('"peerTotal"');
    expect(FIND_SELF_EVALUATION).toContain("type = 'SELF_ASSESSMENT'");
    expect(INSERT_SELF_EVALUATION).toContain('DO NOTHING');
    expect(UPDATE_SELF_DRAFT).toContain('applied_bonus = $1');
    expect(UPDATE_SELF_SUBMISSION).toContain("status = 'SUBMITTED'");
  });
});
