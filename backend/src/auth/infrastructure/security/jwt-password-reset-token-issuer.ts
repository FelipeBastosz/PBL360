import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PASSWORD_RESET_AUDIENCE } from '@/shared/security/access-token';
import type {
  PasswordResetSubject,
  PasswordResetToken,
  PasswordResetTokenIssuer,
} from '../../domain/services/password-reset-token-issuer';

const EXPIRES_IN = '10m';

interface PasswordResetClaims {
  sub: string;
  ver: number;
}

@Injectable()
export class JwtPasswordResetTokenIssuer implements PasswordResetTokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  async issueFor(subject: PasswordResetSubject): Promise<PasswordResetToken> {
    const claims: PasswordResetClaims = { sub: subject.userId, ver: subject.tokenVersion };
    const value = await this.jwt.signAsync(claims, {
      expiresIn: EXPIRES_IN,
      audience: PASSWORD_RESET_AUDIENCE,
    });
    const { exp } = this.jwt.decode<{ exp: number }>(value);

    return { value, expiresAt: new Date(exp * 1000) };
  }

  async verify(token: string): Promise<PasswordResetSubject | null> {
    try {
      const claims = await this.jwt.verifyAsync<PasswordResetClaims>(token, {
        audience: PASSWORD_RESET_AUDIENCE,
      });

      return typeof claims.ver === 'number'
        ? { userId: claims.sub, tokenVersion: claims.ver }
        : null;
    } catch {
      return null;
    }
  }
}
