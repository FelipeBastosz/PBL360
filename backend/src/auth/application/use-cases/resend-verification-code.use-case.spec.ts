import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { UserRepository } from '@/users/domain/repositories/user.repository.interface';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';
import type { EmailVerificationCodeRepository } from '../../domain/repositories/email-verification-code.repository';
import type { VerificationCodeIssuer } from '../services/verification-code-issuer';
import {
  RESEND_COOLDOWN_SECONDS,
  ResendVerificationCodeUseCase,
} from './resend-verification-code.use-case';

const EMAIL = 'carlos@uefs.br';

describe('ResendVerificationCodeUseCase', () => {
  let useCase: ResendVerificationCodeUseCase;

  const findByEmail: jest.MockedFunction<UserRepository['findByEmail']> = jest.fn();
  const findPendingByUserId: jest.MockedFunction<
    EmailVerificationCodeRepository['findPendingByUserId']
  > = jest.fn();
  const issueFor: jest.MockedFunction<VerificationCodeIssuer['issueFor']> = jest.fn();

  const users: UserRepository = { findByEmail, findById: jest.fn(), save: jest.fn() };
  const codes: EmailVerificationCodeRepository = {
    save: jest.fn(),
    findPendingByUserId,
    invalidatePendingFor: jest.fn(),
    markAsUsed: jest.fn(),
  };
  const issuer = { issueFor } as unknown as VerificationCodeIssuer;

  const pendingUser = (): User => {
    const user = User.create({
      name: 'Carlos Mendes',
      email: EMAIL,
      passwordHash: 'hashed',
      type: UserType.TUTOR,
    });
    user.id = 'user-1';

    return user;
  };

  const codeCreatedSecondsAgo = (seconds: number): EmailVerificationCode =>
    Object.assign(
      EmailVerificationCode.issue({
        userId: 'user-1',
        email: EMAIL,
        code: '123456',
        expiresInMinutes: 10,
      }),
      { createdAt: new Date(Date.now() - seconds * 1000) },
    );

  beforeEach(() => {
    jest.resetAllMocks();
    findByEmail.mockResolvedValue(pendingUser());
    findPendingByUserId.mockResolvedValue(null);
    issueFor.mockResolvedValue(undefined);

    useCase = new ResendVerificationCodeUseCase(users, codes, issuer);
  });

  it('issues a new code for a pending account', async () => {
    await useCase.execute({ email: EMAIL });

    expect(issueFor.mock.calls[0][0].id).toBe('user-1');
  });

  it('normalises the e-mail before looking the account up', async () => {
    await useCase.execute({ email: '  Carlos@UEFS.BR ' });

    expect(findByEmail).toHaveBeenCalledWith(EMAIL);
  });

  it('stays silent for an e-mail that is not registered', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: EMAIL })).resolves.toBeUndefined();
    expect(issueFor).not.toHaveBeenCalled();
  });

  it('stays silent for an account that is already verified', async () => {
    const verified = pendingUser();
    verified.activate();
    findByEmail.mockResolvedValue(verified);

    await useCase.execute({ email: EMAIL });

    expect(issueFor).not.toHaveBeenCalled();
  });

  it('does not resend while the last code is inside the cooldown', async () => {
    findPendingByUserId.mockResolvedValue(codeCreatedSecondsAgo(RESEND_COOLDOWN_SECONDS - 5));

    await useCase.execute({ email: EMAIL });

    expect(issueFor).not.toHaveBeenCalled();
  });

  it('resends once the cooldown has elapsed', async () => {
    findPendingByUserId.mockResolvedValue(codeCreatedSecondsAgo(RESEND_COOLDOWN_SECONDS + 5));

    await useCase.execute({ email: EMAIL });

    expect(issueFor).toHaveBeenCalled();
  });

  it('resends when the previous code already expired or was used', async () => {
    findPendingByUserId.mockResolvedValue(null);

    await useCase.execute({ email: EMAIL });

    expect(issueFor).toHaveBeenCalled();
  });
});
