import { EmailVerificationCode } from './email-verification-code.entity';
import { hashCode, MAX_CODE_ATTEMPTS } from './one-time-code';

const issue = () =>
  EmailVerificationCode.issue({
    userId: 'user-1',
    email: 'ana@discente.uefs.br',
    code: '042137',
    expiresInMinutes: 10,
  });

describe('OneTimeCode', () => {
  it('keeps only a hash of the code', () => {
    const code = issue();

    expect(code.codeHash).toBe(hashCode('042137'));
    expect(code.codeHash).toHaveLength(64);
  });

  it('matches only the exact code', () => {
    const code = issue();

    expect(code.matches('042137')).toBe(true);
    expect(code.matches('42137')).toBe(false);
    expect(code.matches('042138')).toBe(false);
  });

  it('is usable while pending, unexpired and with attempts left', () => {
    const code = issue();

    expect(code.isUsable()).toBe(true);
    expect(code.isUsable(new Date(code.expiresAt.getTime() + 1))).toBe(false);
    expect(Object.assign(issue(), { usedAt: new Date() }).isUsable()).toBe(false);
    expect(Object.assign(issue(), { attempts: MAX_CODE_ATTEMPTS }).isUsable()).toBe(false);
  });
});
