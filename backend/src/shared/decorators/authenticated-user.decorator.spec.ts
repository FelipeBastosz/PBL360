import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { AuthenticatedUser } from './authenticated-user.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { AuthenticatedUserPayload } from '../interfaces/authenticated-user.interface';

type DecoratorFactory = (data: unknown, context: ExecutionContext) => AuthenticatedUserPayload;

interface RouteArgsMetadata {
  [key: string]: {
    factory: DecoratorFactory;
  };
}

function getParamDecoratorFactory(): DecoratorFactory {
  class TestController {
    public test(value: unknown) {
      return value;
    }
  }

  AuthenticatedUser()(TestController.prototype, 'test', 0);

  const args = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'test',
  ) as RouteArgsMetadata;
  return args[Object.keys(args)[0]].factory;
}

describe('AuthenticatedUser decorator', () => {
  let factory: DecoratorFactory;

  beforeAll(() => {
    factory = getParamDecoratorFactory();
  });

  const createMockContext = (user?: object): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('extracts the authenticated user payload from the request context', () => {
    const userPayload = {
      sub: 'user-uuid-123',
      email: 'professor@uefs.br',
      type: UserType.TUTOR,
    };
    const context = createMockContext(userPayload);
    const result = factory(null, context);

    expect(result).toEqual({
      id: 'user-uuid-123',
      email: 'professor@uefs.br',
      type: UserType.TUTOR,
    });
  });

  it('throws UnauthorizedException when user is missing', () => {
    const context = createMockContext(undefined);

    expect(() => factory(null, context)).toThrow(UnauthorizedException);
    expect(() => factory(null, context)).toThrow('Identificação do usuário inválida.');
  });

  it('throws UnauthorizedException when sub is missing', () => {
    const context = createMockContext({
      email: 'professor@uefs.br',
      type: UserType.TUTOR,
    });

    expect(() => factory(null, context)).toThrow(UnauthorizedException);
    expect(() => factory(null, context)).toThrow('Identificação do usuário inválida.');
  });

  it('throws UnauthorizedException when email is missing or empty', () => {
    const context = createMockContext({
      sub: 'user-uuid-123',
      email: '',
      type: UserType.TUTOR,
    });

    expect(() => factory(null, context)).toThrow(UnauthorizedException);
    expect(() => factory(null, context)).toThrow('Identificação do usuário inválida.');
  });

  it('throws UnauthorizedException when type is invalid', () => {
    const context = createMockContext({
      sub: 'user-uuid-123',
      email: 'professor@uefs.br',
      type: 'INVALID_ROLE',
    });

    expect(() => factory(null, context)).toThrow(UnauthorizedException);
    expect(() => factory(null, context)).toThrow('Identificação do usuário inválida.');
  });
});
