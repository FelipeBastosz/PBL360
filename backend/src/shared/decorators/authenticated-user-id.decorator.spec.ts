import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { AuthenticatedUserId } from './authenticated-user-id.decorator';

type DecoratorFactory = (data: unknown, context: ExecutionContext) => string;

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

  AuthenticatedUserId()(TestController.prototype, 'test', 0);

  const args = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    TestController,
    'test',
  ) as RouteArgsMetadata;
  return Object.values(args)[0]!.factory;
}

describe('AuthenticatedUserId decorator', () => {
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

  it('extracts the user sub from the request context', () => {
    const context = createMockContext({ sub: 'user-uuid-123' });
    const result = factory(null, context);

    expect(result).toBe('user-uuid-123');
  });

  it('throws UnauthorizedException when user object is missing', () => {
    const context = createMockContext(undefined);

    expect(() => factory(null, context)).toThrow(UnauthorizedException);
    expect(() => factory(null, context)).toThrow('Identificação do usuário inválida.');
  });

  it('throws UnauthorizedException when sub is missing', () => {
    const context = createMockContext({ email: 'test@uefs.br' });

    expect(() => factory(null, context)).toThrow(UnauthorizedException);
    expect(() => factory(null, context)).toThrow('Identificação do usuário inválida.');
  });

  it('throws UnauthorizedException when sub is not a string', () => {
    const context = createMockContext({ sub: 12345 });

    expect(() => factory(null, context)).toThrow(UnauthorizedException);
    expect(() => factory(null, context)).toThrow('Identificação do usuário inválida.');
  });

  it('throws UnauthorizedException when sub is an empty string', () => {
    const context = createMockContext({ sub: '' });

    expect(() => factory(null, context)).toThrow(UnauthorizedException);
    expect(() => factory(null, context)).toThrow('Identificação do usuário inválida.');
  });
});
