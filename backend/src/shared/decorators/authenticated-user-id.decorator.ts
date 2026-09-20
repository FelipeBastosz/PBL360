import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user?: {
    sub?: unknown;
  };
}

export const AuthenticatedUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.sub;

    if (typeof userId !== 'string' || !userId) {
      throw new UnauthorizedException('Identificação do usuário inválida.');
    }

    return userId;
  },
);
