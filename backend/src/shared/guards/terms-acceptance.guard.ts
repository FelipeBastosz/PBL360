import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  USER_TERM_ACCEPTANCE_REPOSITORY,
  type UserTermAcceptanceRepository,
} from '@/commitment-terms/domain/repositories/user-term-acceptance.repository';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_UNACCEPTED_TERMS_KEY } from '../decorators/allow-unaccepted-terms.decorator';

interface RequestWithUser extends Request {
  user?: { sub?: string };
}

export const TERMS_NOT_ACCEPTED_MESSAGE =
  'É necessário aceitar o termo de compromisso para acessar o sistema.';

@Injectable()
export class TermsAcceptanceGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(USER_TERM_ACCEPTANCE_REPOSITORY)
    private readonly acceptances: UserTermAcceptanceRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isAllowedWithoutTerms(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.sub;

    if (!userId) {
      return true;
    }

    const hasAccepted = await this.acceptances.hasAccepted(userId);
    if (!hasAccepted) {
      throw new ForbiddenException(TERMS_NOT_ACCEPTED_MESSAGE);
    }

    return true;
  }

  private isAllowedWithoutTerms(context: ExecutionContext): boolean {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    if (isPublic) {
      return true;
    }

    return (
      this.reflector.getAllAndOverride<boolean>(ALLOW_UNACCEPTED_TERMS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }
}
