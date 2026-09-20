import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserType } from '@/users/domain/enums/user-type.enum';

interface RequestWithUserType extends Request {
  user?: { type?: UserType };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUserType>();
    const user = request.user;

    if (!user || !user.type) {
      throw new ForbiddenException('Usuário não possui as credenciais necessárias.');
    }

    if (!requiredRoles.includes(user.type)) {
      throw new ForbiddenException('Acesso negado para o seu perfil de usuário.');
    }

    return true;
  }
}
