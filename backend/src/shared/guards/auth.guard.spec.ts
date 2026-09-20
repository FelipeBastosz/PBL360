import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { type JwtService } from '@nestjs/jwt';
import { type Reflector } from '@nestjs/core';
import type { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { AuthGuard } from './auth.guard';

interface MockRequest {
  headers: Record<string, string | undefined>;
  user?: unknown;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let verifyAsyncMock: jest.Mock;
  let getAllAndOverrideMock: jest.Mock;
  let request: MockRequest;

  const createMockExecutionContext = (): ExecutionContext => {
    const httpHost = {
      getRequest: () => request,
    } as unknown as HttpArgumentsHost;

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => httpHost,
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    verifyAsyncMock = jest.fn();
    getAllAndOverrideMock = jest.fn();

    const jwtService = {
      verifyAsync: verifyAsyncMock,
    } as unknown as JwtService;

    const reflector = {
      getAllAndOverride: getAllAndOverrideMock,
    } as unknown as Reflector;

    guard = new AuthGuard(jwtService, reflector);
    request = { headers: {} };
  });

  it('allows access immediately if the route is public', async () => {
    getAllAndOverrideMock.mockReturnValue(true);

    const result = await guard.canActivate(createMockExecutionContext());

    expect(result).toBe(true);
    expect(verifyAsyncMock).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException if no authorization header is provided', async () => {
    getAllAndOverrideMock.mockReturnValue(false);

    await expect(guard.canActivate(createMockExecutionContext())).rejects.toThrow(
      new UnauthorizedException('Token de autenticação não fornecido.'),
    );
  });

  it('throws UnauthorizedException if token type is not Bearer', async () => {
    getAllAndOverrideMock.mockReturnValue(false);
    request.headers.authorization = 'Basic token123';

    await expect(guard.canActivate(createMockExecutionContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException if the token is invalid or expired', async () => {
    getAllAndOverrideMock.mockReturnValue(false);
    request.headers.authorization = 'Bearer invalid_token';
    verifyAsyncMock.mockRejectedValue(new Error('JWT Expired'));

    await expect(guard.canActivate(createMockExecutionContext())).rejects.toThrow(
      new UnauthorizedException('Token de autenticação inválido ou expirado.'),
    );
  });

  it('injects the payload into the request and allows access if the token is valid', async () => {
    getAllAndOverrideMock.mockReturnValue(false);
    request.headers.authorization = 'Bearer valid_token';

    const validPayload = { sub: '123', type: 'STUDENT' };
    verifyAsyncMock.mockResolvedValue(validPayload);

    const result = await guard.canActivate(createMockExecutionContext());

    expect(result).toBe(true);
    expect(request.user).toEqual(validPayload);
  });
});
