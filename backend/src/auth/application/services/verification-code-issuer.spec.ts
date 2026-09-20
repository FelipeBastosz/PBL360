import { Logger } from '@nestjs/common';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { EmailVerificationCodeRepository } from '../../domain/repositories/email-verification-code.repository';
import type { EmailVerificationSender } from '../../domain/services/email-verification-sender';
import { EXPIRATION_MINUTES, VerificationCodeIssuer } from './verification-code-issuer';

describe('VerificationCodeIssuer', () => {
  let issuer: VerificationCodeIssuer;

  const saveCode: jest.MockedFunction<EmailVerificationCodeRepository['save']> = jest.fn();
  const invalidatePendingFor: jest.MockedFunction<
    EmailVerificationCodeRepository['invalidatePendingFor']
  > = jest.fn();
  const sendVerificationCode: jest.MockedFunction<EmailVerificationSender['sendVerificationCode']> =
    jest.fn();

  const codes: EmailVerificationCodeRepository = {
    save: saveCode,
    findPendingByUserId: jest.fn(),
    invalidatePendingFor,
    markAsUsed: jest.fn(),
  };
  const verification: EmailVerificationSender = { sendVerificationCode };

  const pendingUser = (): User => {
    const user = User.create({
      name: 'Carlos Mendes',
      email: 'carlos@uefs.br',
      passwordHash: 'hashed',
      type: UserType.TUTOR,
    });
    user.id = 'user-1';

    return user;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    saveCode.mockResolvedValue(undefined);
    invalidatePendingFor.mockResolvedValue(undefined);
    sendVerificationCode.mockResolvedValue(undefined);

    issuer = new VerificationCodeIssuer(codes, verification);
  });

  it('stores a six digit code bound to the user', async () => {
    await issuer.issueFor(pendingUser());

    expect(saveCode).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        email: 'carlos@uefs.br',
        code: expect.stringMatching(/^\d{6}$/) as string,
        usedAt: null,
      }),
    );
  });

  it('burns the codes still pending before storing the new one', async () => {
    await issuer.issueFor(pendingUser());

    expect(invalidatePendingFor).toHaveBeenCalledWith('user-1');
    expect(invalidatePendingFor.mock.invocationCallOrder[0]).toBeLessThan(
      saveCode.mock.invocationCallOrder[0],
    );
  });

  it('expires the code after the configured window', async () => {
    const before = Date.now();

    await issuer.issueFor(pendingUser());

    const stored = saveCode.mock.calls[0][0];
    const window = stored.expiresAt.getTime() - before;

    expect(window).toBeGreaterThan((EXPIRATION_MINUTES - 1) * 60 * 1000);
    expect(window).toBeLessThanOrEqual(EXPIRATION_MINUTES * 60 * 1000);
  });

  it('sends the very code it stored', async () => {
    await issuer.issueFor(pendingUser());

    const stored = saveCode.mock.calls[0][0];
    expect(sendVerificationCode).toHaveBeenCalledWith({
      userId: 'user-1',
      name: 'Carlos Mendes',
      email: 'carlos@uefs.br',
      code: stored.code,
    });
  });

  it('swallows a failure from the e-mail provider', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    sendVerificationCode.mockRejectedValue(new Error('smtp is down'));

    await expect(issuer.issueFor(pendingUser())).resolves.toBeUndefined();
    expect(saveCode).toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});
