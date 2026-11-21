import { UserTermAcceptance } from './user-term-acceptance.entity';

describe('UserTermAcceptance', () => {
  it('creates an acceptance with trimmed version and server date', () => {
    const acceptance = UserTermAcceptance.create({
      userId: '11111111-1111-1111-1111-111111111111',
      termId: '22222222-2222-2222-2222-222222222222',
      termVersion: ' 1.0 ',
    });

    expect(acceptance.userId).toBe('11111111-1111-1111-1111-111111111111');
    expect(acceptance.termId).toBe('22222222-2222-2222-2222-222222222222');
    expect(acceptance.termVersion).toBe('1.0');
    expect(acceptance.acceptedAt).toBeInstanceOf(Date);
  });
});
