import { BadRequestException } from '@nestjs/common';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { UserRepository } from '@/users/domain/repositories/user.repository.interface';
import { VerifyEmailCodeUseCase } from './verify-email-code.use-case';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';
import type { EmailVerificationCodeRepository } from '../../domain/repositories/email-verification-code.repository';
import type { AccessTokenIssuer } from '../../domain/services/access-token-issuer';

const USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const EMAIL = 'usuario@uefs.br';
const INVALID_CODE = 'Código de verificação inválido ou expirado.';

describe('VerifyEmailCodeUseCase', () => {
  let useCase: VerifyEmailCodeUseCase;

  const findById: jest.MockedFunction<UserRepository['findById']> = jest.fn();
  const saveUser: jest.MockedFunction<UserRepository['save']> = jest.fn();
  const findPendingByUserId: jest.MockedFunction<
    EmailVerificationCodeRepository['findPendingByUserId']
  > = jest.fn();
  const markAsUsed: jest.MockedFunction<EmailVerificationCodeRepository['markAsUsed']> = jest.fn();
  const issueFor: jest.MockedFunction<AccessTokenIssuer['issueFor']> = jest.fn();

  const users: UserRepository = { findByEmail: jest.fn(), findById, save: saveUser };
  const codes: EmailVerificationCodeRepository = {
    save: jest.fn(),
    findPendingByUserId,
    invalidatePendingFor: jest.fn(),
    markAsUsed,
  };
  const tokens: AccessTokenIssuer = { issueFor };

  const pendingUser = (): User => {
    const user = User.create({
      name: 'Carlos Mendes',
      email: EMAIL,
      passwordHash: 'hashed',
      type: UserType.TUTOR,
    });
    user.id = USER_ID;

    return user;
  };

  const pendingCode = (overrides: Partial<EmailVerificationCode> = {}): EmailVerificationCode =>
    Object.assign(
      EmailVerificationCode.issue({
        userId: USER_ID,
        email: EMAIL,
        code: '123456',
        expiresInMinutes: 10,
      }),
      { id: 'uuid-123' },
      overrides,
    );

  const input = { userId: USER_ID, email: EMAIL, code: '123456' };

  beforeEach(() => {
    jest.resetAllMocks();
    findById.mockResolvedValue(pendingUser());
    saveUser.mockImplementation((user) => Promise.resolve(user));
    findPendingByUserId.mockResolvedValue(pendingCode());
    issueFor.mockResolvedValue({ value: 'jwt-token', expiresAt: new Date() });

    useCase = new VerifyEmailCodeUseCase(users, codes, tokens);
  });

  it('marks the code as used and activates the account', async () => {
    const session = await useCase.execute(input);

    expect(markAsUsed).toHaveBeenCalledWith('uuid-123');
    expect(saveUser.mock.calls[0][0].active).toBe(true);
    expect(session.user.active).toBe(true);
  });

  it('looks the pending code up by the user id, not by the e-mail', async () => {
    await useCase.execute(input);

    expect(findPendingByUserId).toHaveBeenCalledWith(USER_ID);
  });

  it('issues a session token for the activated account', async () => {
    const session = await useCase.execute(input);

    expect(issueFor).toHaveBeenCalledWith(session.user);
    expect(session.accessToken.value).toBe('jwt-token');
  });

  it('accepts an e-mail that differs only in case and spacing', async () => {
    await expect(useCase.execute({ ...input, email: '  Usuario@UEFS.br ' })).resolves.toMatchObject(
      { user: { active: true } },
    );
  });

  it('rejects a user id that does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(INVALID_CODE);
    expect(findPendingByUserId).not.toHaveBeenCalled();
  });

  it('rejects an e-mail that does not belong to the user id', async () => {
    await expect(useCase.execute({ ...input, email: 'outro@uefs.br' })).rejects.toThrow(
      INVALID_CODE,
    );
    expect(saveUser).not.toHaveBeenCalled();
  });

  it('rejects an account that is already verified', async () => {
    const verified = pendingUser();
    verified.activate();
    findById.mockResolvedValue(verified);

    await expect(useCase.execute(input)).rejects.toThrow('Esta conta já foi verificada.');
    expect(saveUser).not.toHaveBeenCalled();
  });

  it('rejects when there is no pending code', async () => {
    findPendingByUserId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(BadRequestException);
    expect(saveUser).not.toHaveBeenCalled();
  });

  it('rejects a code that does not match', async () => {
    findPendingByUserId.mockResolvedValue(pendingCode({ code: '654321' }));

    await expect(useCase.execute(input)).rejects.toThrow(INVALID_CODE);
    expect(markAsUsed).not.toHaveBeenCalled();
  });

  it('rejects an expired code', async () => {
    findPendingByUserId.mockResolvedValue(pendingCode({ expiresAt: new Date(Date.now() - 1000) }));

    await expect(useCase.execute(input)).rejects.toThrow(INVALID_CODE);
    expect(saveUser).not.toHaveBeenCalled();
  });

  it('rejects a code that was already used', async () => {
    findPendingByUserId.mockResolvedValue(pendingCode({ usedAt: new Date() }));

    await expect(useCase.execute(input)).rejects.toThrow(INVALID_CODE);
    expect(saveUser).not.toHaveBeenCalled();
  });
});
