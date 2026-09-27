import { QueryFailedError } from 'typeorm';
import { violatedUniqueConstraint } from './unique-violation';

const queryError = (driverError: object): QueryFailedError =>
  new QueryFailedError('INSERT ...', [], Object.assign(new Error('db'), driverError));

describe('violatedUniqueConstraint', () => {
  it('returns the constraint name of a unique violation', () => {
    expect(
      violatedUniqueConstraint(queryError({ code: '23505', constraint: 'uq_users_email' })),
    ).toBe('uq_users_email');
  });

  it('ignores other database errors', () => {
    expect(violatedUniqueConstraint(queryError({ code: '23503' }))).toBeNull();
  });

  it('ignores errors that did not come from a query', () => {
    expect(violatedUniqueConstraint(new Error('boom'))).toBeNull();
  });
});
