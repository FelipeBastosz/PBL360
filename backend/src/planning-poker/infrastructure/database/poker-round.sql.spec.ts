import {
  CAST_VOTE_SQL,
  DECIDE_ROUND_SQL,
  DELETE_OPEN_ROUND_SQL,
  FIND_VOTES_SQL,
  INSERT_ROUND_SQL,
  RESTART_ROUND_SQL,
  REVEAL_ROUND_SQL,
  ROUND_COLUMNS,
  UPDATE_QUEUE_SQL,
} from './poker-round.sql';

describe('planning poker round SQL contracts', () => {
  it('uses shared round fields and stores the ordered queue', () => {
    expect(ROUND_COLUMNS).toContain('round_number AS "number"');
    expect(INSERT_ROUND_SQL).toContain('RETURNING');
    expect(UPDATE_QUEUE_SQL).toContain('queue = $2::uuid[]');
  });

  it('guards round transitions by the expected prior state', () => {
    expect(DELETE_OPEN_ROUND_SQL).toContain("status <> 'DECIDED'");
    expect(REVEAL_ROUND_SQL).toContain("status = 'VOTING'");
    expect(RESTART_ROUND_SQL).toContain("status = 'REVEALED'");
    expect(DECIDE_ROUND_SQL).toContain("status = 'REVEALED'");
  });

  it('upserts votes only during voting and lists them in stable order', () => {
    expect(CAST_VOTE_SQL).toContain("status = 'VOTING'");
    expect(CAST_VOTE_SQL).toContain('DO UPDATE SET score = EXCLUDED.score');
    expect(FIND_VOTES_SQL).toContain('ORDER BY voted_at, id');
  });
});
