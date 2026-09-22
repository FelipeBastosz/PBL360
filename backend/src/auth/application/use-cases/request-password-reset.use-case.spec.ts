import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { UserRepository } from '@/users/domain/repositories/user.repository.interface';
import { PasswordResetCode } from '../../domain/entities/password-reset-code.entity';
import type { PasswordResetCodeRepository } from '../../domain/repositories/password-reset-code.repository';
import type { PasswordResetCodeIssuer } from '../services/password-reset-code-issuer';
import {
  REQUEST_COOLDOWN_SECONDS,
  RequestPasswordResetUseCase,
} from './request-password-reset.use-case';

const EMAIL = 'carlos@uefs.br';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;

  const findByEmail: jest.MockedFunction<UserRepository['findByEmail']> = jest.fn();
  const findPendingByUserId: jest.MockedFunction<
    PasswordResetCodeRepository['findPendingByUserId']
  > = jest.fn();
  const issueFor: jest.MockedFunction<PasswordResetCodeIssuer['issueFor']> = jest.fn();

  const users: UserRepository = { findByEmail, findById: jest.fn(), save: jest.fn() };
  const codes: PasswordResetCodeRepository = {
    save: jest.fn(),
    findPendingByUserId,
    invalidatePendingFor: jest.fn(),
    markAsUsed: jest.fn(),
    registerFailedAttempt: jest.fn(),
  };
  const issuer = { issueFor } as unknown as PasswordResetCodeIssuer;

  const existingUser = (): User => {
    const user = User.create({
      name: 'Carlos Mendes',
      email: EMAIL,
      passwordHash: 'hashed',
      type: UserType.TUTOR,
    });
    user.id = 'user-1';
    user.activate();

    return user;
  };

  const codeCreatedSecondsAgo = (seconds: number): PasswordResetCode =>
    Object.assign(
      PasswordResetCode.issue({
        userId: 'user-1',
        email: EMAIL,
        code: '123456',
        expiresInMinutes: 10,
      }),
      { createdAt: new Date(Date.now() - seconds * 1000) },
    );

  beforeEach(() => {
    jest.resetAllMocks();
    findByEmail.mockResolvedValue(existingUser());
    findPendingByUserId.mockResolvedValue(null);
    issueFor.mockResolvedValue(undefined);

    useCase = new RequestPasswordResetUseCase(users, codes, issuer);
  });

  it('issues a reset code for a registered account', async () => {
    await useCase.execute({ email: EMAIL });

    expect(issueFor.mock.calls[0][0].id).toBe('user-1');
  });

  it('normalises the e-mail before looking the account up', async () => {
    await useCase.execute({ email: '  Carlos@UEFS.BR ' });

    expect(findByEmail).toHaveBeenCalledWith(EMAIL);
  });

  it('stays silent and resolves the same way for an e-mail that is not registered', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: EMAIL })).resolves.toBeUndefined();
    expect(issueFor).not.toHaveBeenCalled();
  });

  it('does not issue a new code while the last one is inside the cooldown', async () => {
    findPendingByUserId.mockResolvedValue(codeCreatedSecondsAgo(REQUEST_COOLDOWN_SECONDS - 5));

    await useCase.execute({ email: EMAIL });

    expect(issueFor).not.toHaveBeenCalled();
  });

  it('issues a new code once the cooldown has elapsed', async () => {
    findPendingByUserId.mockResolvedValue(codeCreatedSecondsAgo(REQUEST_COOLDOWN_SECONDS + 5));

    await useCase.execute({ email: EMAIL });

    expect(issueFor).toHaveBeenCalled();
  });
});
