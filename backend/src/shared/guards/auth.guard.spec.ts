import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Reflector } from '@nestjs/core';
import { User } from '@/users/domain/entities/user.entity';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { UserRepository } from '@/users/domain/repositories/user.repository';
import { ACCESS_TOKEN_AUDIENCE } from '../security/access-token';
import { AuthGuard } from './auth.guard';

interface MockRequest {
  headers: Record<string, string | undefined>;
  user?: unknown;
}

const INVALID = new UnauthorizedException('Token de autenticação inválido ou expirado.');

const activeTutor = (tokenVersion = 0): User =>
  Object.assign(new User(), {
    id: 'user-1',
    email: 'carlos@uefs.br',
    type: UserType.TUTOR,
    active: true,
    tokenVersion,
  });

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let verifyAsync: jest.Mock;
  let isPublic: jest.Mock;
  let findById: jest.Mock;
  let request: MockRequest;

  const context = (): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  const withBearer = (): void => {
    request.headers.authorization = 'Bearer valid-token';
  };

  beforeEach(() => {
    verifyAsync = jest.fn();
    isPublic = jest.fn().mockReturnValue(false);
    findById = jest.fn();
    const users = { findById } as unknown as UserRepository;

    guard = new AuthGuard(
      { verifyAsync } as unknown as JwtService,
      { getAllAndOverride: isPublic } as unknown as Reflector,
      users,
    );
    request = { headers: {} };
  });

  it('lets public routes through without a token', async () => {
    isPublic.mockReturnValue(true);

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('requires a bearer token', async () => {
    await expect(guard.canActivate(context())).rejects.toThrow(
      new UnauthorizedException('Token de autenticação não fornecido.'),
    );
  });

  it('ignores schemes other than Bearer', async () => {
    request.headers.authorization = 'Basic abc';

    await expect(guard.canActivate(context())).rejects.toThrow(UnauthorizedException);
  });

  it('only accepts access tokens', async () => {
    withBearer();
    verifyAsync.mockRejectedValue(new Error('jwt audience invalid'));

    await expect(guard.canActivate(context())).rejects.toThrow(INVALID);
    expect(verifyAsync).toHaveBeenCalledWith('valid-token', { audience: ACCESS_TOKEN_AUDIENCE });
  });

  it('attaches the current claims of the user to the request', async () => {
    withBearer();
    verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'old@uefs.br', type: 'STUDENT', ver: 0 });
    findById.mockResolvedValue(activeTutor());

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(request.user).toEqual({
      sub: 'user-1',
      email: 'carlos@uefs.br',
      type: UserType.TUTOR,
      ver: 0,
    });
  });

  it('rejects a token issued before the sessions were revoked', async () => {
    withBearer();
    verifyAsync.mockResolvedValue({ sub: 'user-1', ver: 0 });
    findById.mockResolvedValue(activeTutor(1));

    await expect(guard.canActivate(context())).rejects.toThrow(INVALID);
  });

  it.each([
    ['a user that no longer exists', null],
    ['an inactive user', Object.assign(activeTutor(), { active: false })],
  ])('rejects the token of %s', async (_label, user) => {
    withBearer();
    verifyAsync.mockResolvedValue({ sub: 'user-1', ver: 0 });
    findById.mockResolvedValue(user);

    await expect(guard.canActivate(context())).rejects.toThrow(INVALID);
  });
});
