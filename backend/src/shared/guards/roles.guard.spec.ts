import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { type Reflector } from '@nestjs/core';
import type { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { RolesGuard } from './roles.guard';
import { UserType } from '@/users/domain/enums/user-type.enum';

interface MockRequest {
  user?: { type?: UserType | string; sub?: string };
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;
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
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
    request = {};
  });

  it('allows access if no roles are required for the route', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(createMockExecutionContext());

    expect(result).toBe(true);
  });

  it('throws ForbiddenException if there is no user in the request', () => {
    reflector.getAllAndOverride.mockReturnValue([UserType.TUTOR]);

    expect(() => guard.canActivate(createMockExecutionContext())).toThrow(
      new ForbiddenException('Usuário não possui as credenciais necessárias.'),
    );
  });

  it('throws ForbiddenException if the user has no type defined', () => {
    reflector.getAllAndOverride.mockReturnValue([UserType.TUTOR]);
    request.user = { sub: '123' };

    expect(() => guard.canActivate(createMockExecutionContext())).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException if the user type does not match the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([UserType.TUTOR]);
    request.user = { sub: '123', type: UserType.STUDENT };

    expect(() => guard.canActivate(createMockExecutionContext())).toThrow(
      new ForbiddenException('Acesso negado para o seu perfil de usuário.'),
    );
  });

  it('allows access if the user type is included in the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([UserType.TUTOR, UserType.STUDENT]);
    request.user = { sub: '123', type: UserType.STUDENT };

    const result = guard.canActivate(createMockExecutionContext());

    expect(result).toBe(true);
  });
});
