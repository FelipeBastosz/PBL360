import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { UserType } from '@/users/domain/enums/user-type.enum';
import { AuthenticatedUser, type AuthenticatedUserRef } from './authenticated-user.decorator';

type DecoratorFactory = (data: unknown, context: ExecutionContext) => AuthenticatedUserRef;

function getParamDecoratorFactory(): DecoratorFactory {
  class TestController {
    public test(value: unknown) {
      return value;
    }
  }

  AuthenticatedUser()(TestController.prototype, 'test', 0);

  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'test') as Record<
    string,
    { factory: DecoratorFactory }
  >;
  return Object.values(args)[0]!.factory;
}

const contextWith = (user?: object): ExecutionContext =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as unknown as ExecutionContext;

describe('AuthenticatedUser decorator', () => {
  const factory = getParamDecoratorFactory();

  it('extracts the id and the type of the authenticated user', () => {
    expect(factory(null, contextWith({ sub: 'user-1', type: UserType.STUDENT }))).toEqual({
      id: 'user-1',
      type: UserType.STUDENT,
    });
  });

  it.each([
    undefined,
    { type: UserType.TUTOR },
    { sub: 'user-1' },
    { sub: 'user-1', type: 'ADMIN' },
  ])('rejects an incomplete identification %o', (user) => {
    expect(() => factory(null, contextWith(user))).toThrow(
      new UnauthorizedException('Identificação do usuário inválida.'),
    );
  });
});
