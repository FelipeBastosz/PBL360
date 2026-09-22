import { BadRequestException } from '@nestjs/common';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { UserRepository } from '@/users/domain/repositories/user.repository.interface';
import {
  MAX_VALIDATION_ATTEMPTS,
  PasswordResetCode,
} from '../../domain/entities/password-reset-code.entity';
import type { PasswordResetCodeRepository } from '../../domain/repositories/password-reset-code.repository';
import type { PasswordResetTokenIssuer } from '../../domain/services/password-reset-token-issuer';
import { ValidatePasswordResetCodeUseCase } from './validate-password-reset-code.use-case';

const EMAIL = 'carlos@uefs.br';
const CODE = '123456';

describe('ValidatePasswordResetCodeUseCase', () => {
  let useCase: ValidatePasswordResetCodeUseCase;

  const findByEmail: jest.MockedFunction<UserRepository['findByEmail']> = jest.fn();
  const findPendingByUserId: jest.MockedFunction<
    PasswordResetCodeRepository['findPendingByUserId']
  > = jest.fn();
  const markAsUsed: jest.MockedFunction<PasswordResetCodeRepository['markAsUsed']> = jest.fn();
  const registerFailedAttempt: jest.MockedFunction<
    PasswordResetCodeRepository['registerFailedAttempt']
  > = jest.fn();
  const issueFor: jest.MockedFunction<PasswordResetTokenIssuer['issueFor']> = jest.fn();

  const users: UserRepository = { findByEmail, findById: jest.fn(), save: jest.fn() };
  const codes: PasswordResetCodeRepository = {
    save: jest.fn(),
    findPendingByUserId,
    invalidatePendingFor: jest.fn(),
    markAsUsed,
    registerFailedAttempt,
  };
  const tokens = { issueFor, verify: jest.fn() } as unknown as PasswordResetTokenIssuer;

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

  const validCode = (): PasswordResetCode =>
    PasswordResetCode.issue({ userId: 'user-1', email: EMAIL, code: CODE, expiresInMinutes: 10 });

  beforeEach(() => {
    jest.resetAllMocks();
    findByEmail.mockResolvedValue(existingUser());
    findPendingByUserId.mockResolvedValue(validCode());
    issueFor.mockResolvedValue({ value: 'reset-token', expiresAt: new Date() });

    useCase = new ValidatePasswordResetCodeUseCase(users, codes, tokens);
  });

  it('issues a reset token and consumes the code when it matches', async () => {
    await useCase.execute({ email: EMAIL, code: CODE });

    expect(markAsUsed).toHaveBeenCalledWith(expect.any(String));
    expect(issueFor).toHaveBeenCalledWith('user-1');
  });

  it('rejects a wrong code and counts the attempt', async () => {
    const pendingCode = validCode();
    findPendingByUserId.mockResolvedValue(pendingCode);

    await expect(useCase.execute({ email: EMAIL, code: '000000' })).rejects.toThrow(
      BadRequestException,
    );

    expect(registerFailedAttempt).toHaveBeenCalledWith(pendingCode.id);
    expect(issueFor).not.toHaveBeenCalled();
  });

  it('rejects a correct code once attempts are exhausted', async () => {
    const exhausted = validCode();
    exhausted.attempts = MAX_VALIDATION_ATTEMPTS;
    findPendingByUserId.mockResolvedValue(exhausted);

    await expect(useCase.execute({ email: EMAIL, code: CODE })).rejects.toThrow(
      BadRequestException,
    );
    expect(issueFor).not.toHaveBeenCalled();
  });

  it('rejects when there is no pending code', async () => {
    findPendingByUserId.mockResolvedValue(null);

    await expect(useCase.execute({ email: EMAIL, code: CODE })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects an unregistered e-mail with the same error', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: EMAIL, code: CODE })).rejects.toThrow(
      BadRequestException,
    );
  });
});
