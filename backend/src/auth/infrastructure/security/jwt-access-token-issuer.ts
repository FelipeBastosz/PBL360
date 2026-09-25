import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_AUDIENCE, type AccessTokenClaims } from '@/shared/security/access-token';
import type { User } from '@/users/domain/entities/user.entity';
import type { AccessToken, AccessTokenIssuer } from '../../domain/services/access-token-issuer';

@Injectable()
export class JwtAccessTokenIssuer implements AccessTokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  async issueFor(user: User): Promise<AccessToken> {
    const value = await this.jwt.signAsync(this.claimsFor(user), {
      audience: ACCESS_TOKEN_AUDIENCE,
    });

    return { value, expiresAt: this.expiryOf(value) };
  }

  private claimsFor(user: User): AccessTokenClaims {
    return { sub: user.id, email: user.email, type: user.type, ver: user.tokenVersion };
  }

  private expiryOf(token: string): Date {
    const { exp } = this.jwt.decode<{ exp: number }>(token);
    return new Date(exp * 1000);
  }
}
