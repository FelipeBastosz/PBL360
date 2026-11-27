import { getMetadataArgsStorage } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { PasswordResetCode } from './password-reset-code.entity';

describe('PasswordResetCode', () => {
  it('issues a password reset code with a hash and expiry', () => {
    const before = Date.now();
    const code = PasswordResetCode.issue({
      userId: 'user-1',
      email: 'ana@discente.uefs.br',
      code: '654321',
      expiresInMinutes: 5,
    });

    expect(code).toMatchObject({
      userId: 'user-1',
      email: 'ana@discente.uefs.br',
      attempts: 0,
      usedAt: null,
    });
    expect(code.codeHash).not.toContain('654321');
    expect(code.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 5 * 60_000);
    expect(code.matches('654321')).toBe(true);
  });

  it('declares a relation to the user entity', () => {
    const relation = getMetadataArgsStorage().relations.find(
      ({ target }) => target === PasswordResetCode,
    );

    expect(relation).toBeDefined();
    expect(Reflect.apply(relation!.type as (...args: never[]) => unknown, undefined, [])).toBe(
      User,
    );
  });
});
