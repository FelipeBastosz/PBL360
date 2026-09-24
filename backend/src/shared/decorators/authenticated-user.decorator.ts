import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { UserType } from '@/users/domain/enums/user-type.enum';
import type { AuthenticatedUserPayload } from '../interfaces/authenticated-user.interface';

interface RequestWithUser extends Request {
  user?: {
    sub?: unknown;
    email?: unknown;
    type?: unknown;
  };
}

export const AuthenticatedUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUserPayload => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (
      !user ||
      typeof user.sub !== 'string' ||
      !user.sub ||
      typeof user.email !== 'string' ||
      !user.email ||
      typeof user.type !== 'string' ||
      !(user.type in UserType)
    ) {
      throw new UnauthorizedException('Identificação do usuário inválida.');
    }

    return {
      id: user.sub,
      email: user.email,
      type: user.type as UserType,
    };
  },
);
