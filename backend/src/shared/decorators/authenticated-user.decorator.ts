import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { UserType } from '@/users/domain/enums/user-type.enum';

export interface AuthenticatedUserRef {
  id: string;
  type: UserType;
}

interface RequestWithUser extends Request {
  user?: { sub?: unknown; type?: unknown };
}

const USER_TYPES = Object.values(UserType) as unknown[];

export const AuthenticatedUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUserRef => {
    const user = context.switchToHttp().getRequest<RequestWithUser>().user;

    if (typeof user?.sub !== 'string' || !user.sub || !USER_TYPES.includes(user.type)) {
      throw new UnauthorizedException('Identificação do usuário inválida.');
    }

    return { id: user.sub, type: user.type as UserType };
  },
);
