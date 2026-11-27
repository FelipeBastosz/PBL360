import { UserType } from '@/users/domain/enums/user-type.enum';
import { ForbiddenError, UnauthorizedError } from '@/shared/errors/application.error';
import { PokerSocketAuthenticator } from './poker-socket-authenticator';

describe('PokerSocketAuthenticator', () => {
  const sessionId = 'c16a10ba-77c4-4da5-8c4d-21f256e5ce19';
  const userId = '34a3d9db-095a-4409-8f99-15baa6e29312';
  const createAuthenticator = (type: UserType = UserType.TUTOR) => {
    const user = {
      id: userId,
      type,
      tokenVersion: 4,
      isPendingVerification: jest.fn().mockReturnValue(false),
    };
    const jwt = { verifyAsync: jest.fn().mockResolvedValue({ sub: userId, ver: 4 }) };
    const users = { findById: jest.fn().mockResolvedValue(user) };
    const pokers = {
      findRoster: jest.fn().mockResolvedValue({ participants: [{ studentId: userId }] }),
    };
    const access = {
      assertTutorCanAccessSessionById: jest.fn(),
      assertMemberCanAccessSession: jest.fn(),
    };
    const authenticator = new PokerSocketAuthenticator(
      jwt as never,
      users as never,
      pokers as never,
      access as never,
    );
    return { authenticator, user, jwt, users, pokers, access };
  };

  it('rejects malformed session ids before validating a token', async () => {
    const { authenticator, jwt } = createAuthenticator();
    await expect(
      authenticator.authenticate({ token: 'token', sessaoId: 'bad-id' }),
    ).rejects.toThrow(new ForbiddenError('Sessão inválida.'));
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects missing, invalid, absent, pending and stale-token users', async () => {
    const missingToken = createAuthenticator();
    await expect(missingToken.authenticator.authenticate({ sessaoId: sessionId })).rejects.toThrow(
      UnauthorizedError,
    );

    const invalidToken = createAuthenticator();
    invalidToken.jwt.verifyAsync.mockRejectedValue(new Error('expired'));
    await expect(
      invalidToken.authenticator.authenticate({ token: 'bad', sessaoId: sessionId }),
    ).rejects.toThrow(UnauthorizedError);

    const missingUser = createAuthenticator();
    missingUser.users.findById.mockResolvedValue(null);
    await expect(
      missingUser.authenticator.authenticate({ token: 'token', sessaoId: sessionId }),
    ).rejects.toThrow(UnauthorizedError);

    const pendingUser = createAuthenticator();
    pendingUser.user.isPendingVerification.mockReturnValue(true);
    await expect(
      pendingUser.authenticator.authenticate({ token: 'token', sessaoId: sessionId }),
    ).rejects.toThrow(UnauthorizedError);

    const staleToken = createAuthenticator();
    staleToken.jwt.verifyAsync.mockResolvedValue({ sub: userId, ver: 3 });
    await expect(
      staleToken.authenticator.authenticate({ token: 'token', sessaoId: sessionId }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('authorizes tutors through session access checks', async () => {
    const { authenticator, access, pokers } = createAuthenticator();
    await expect(
      authenticator.authenticate({ token: 'valid', sessaoId: sessionId }),
    ).resolves.toEqual({ sessionId, audience: 'TUTOR' });
    expect(access.assertTutorCanAccessSessionById).toHaveBeenCalledWith(sessionId, userId);
    expect(pokers.findRoster).not.toHaveBeenCalled();
  });

  it('requires students to have session access and be part of the poker roster', async () => {
    const { authenticator, access, pokers } = createAuthenticator(UserType.STUDENT);
    await expect(
      authenticator.authenticate({ token: 'valid', sessaoId: sessionId }),
    ).resolves.toEqual({ sessionId, audience: 'STUDENT' });
    expect(access.assertMemberCanAccessSession).toHaveBeenCalledWith(
      sessionId,
      expect.objectContaining({ id: userId, type: UserType.STUDENT }),
    );

    pokers.findRoster.mockResolvedValue({ participants: [{ studentId: 'other' }] });
    await expect(
      authenticator.authenticate({ token: 'valid', sessaoId: sessionId }),
    ).rejects.toThrow(new ForbiddenError('Você não participou desta sessão.'));
  });
});
