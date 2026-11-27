import { getMetadataArgsStorage } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { EmailVerificationCode } from './email-verification-code.entity';

describe('EmailVerificationCode', () => {
  it('issues an email verification code with a hash and expiry', () => {
    const before = Date.now();
    const code = EmailVerificationCode.issue({
      userId: 'user-1',
      email: 'ana@discente.uefs.br',
      code: '123456',
      expiresInMinutes: 10,
    });

    expect(code).toMatchObject({
      userId: 'user-1',
      email: 'ana@discente.uefs.br',
      attempts: 0,
      usedAt: null,
    });
    expect(code.codeHash).not.toContain('123456');
    expect(code.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 10 * 60_000);
    expect(code.matches('123456')).toBe(true);
  });

  it('declares a relation to the user entity', () => {
    const relation = getMetadataArgsStorage().relations.find(
      ({ target }) => target === EmailVerificationCode,
    );

    expect(relation).toBeDefined();
    expect(Reflect.apply(relation!.type as (...args: never[]) => unknown, undefined, [])).toBe(
      User,
    );
  });
});
