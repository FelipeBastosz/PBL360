import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@/users/domain/repositories/user.repository.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ACCESS_TOKEN_AUDIENCE, type AccessTokenClaims } from '../security/access-token';

interface RequestWithUser extends Request {
  user?: AccessTokenClaims;
}

const MISSING_TOKEN = 'Token de autenticação não fornecido.';
const INVALID_TOKEN = 'Token de autenticação inválido ou expirado.';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublicRoute(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(MISSING_TOKEN);
    }

    request.user = await this.currentClaims(await this.verifyToken(token));
    return true;
  }

  private isPublicRoute(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false
    );
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async verifyToken(token: string): Promise<AccessTokenClaims> {
    try {
      return await this.jwtService.verifyAsync<AccessTokenClaims>(token, {
        audience: ACCESS_TOKEN_AUDIENCE,
      });
    } catch {
      throw new UnauthorizedException(INVALID_TOKEN);
    }
  }

  private async currentClaims(claims: AccessTokenClaims): Promise<AccessTokenClaims> {
    const user = typeof claims.sub === 'string' ? await this.users.findById(claims.sub) : null;

    if (!user || user.isPendingVerification() || user.tokenVersion !== claims.ver) {
      throw new UnauthorizedException(INVALID_TOKEN);
    }

    return { sub: user.id, email: user.email, type: user.type, ver: user.tokenVersion };
  }
}
