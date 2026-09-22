import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type {
  PasswordResetToken,
  PasswordResetTokenIssuer,
} from '../../domain/services/password-reset-token-issuer';

const PURPOSE = 'password-reset';
const EXPIRES_IN = '10m';

interface PasswordResetClaims {
  sub: string;
  purpose: typeof PURPOSE;
}

@Injectable()
export class JwtPasswordResetTokenIssuer implements PasswordResetTokenIssuer {
  constructor(private readonly jwt: JwtService) {}

  async issueFor(userId: string): Promise<PasswordResetToken> {
    const claims: PasswordResetClaims = { sub: userId, purpose: PURPOSE };
    const value = await this.jwt.signAsync(claims, { expiresIn: EXPIRES_IN });
    const { exp } = this.jwt.decode<{ exp: number }>(value);

    return { value, expiresAt: new Date(exp * 1000) };
  }

  async verify(token: string): Promise<string | null> {
    try {
      const claims = await this.jwt.verifyAsync<PasswordResetClaims>(token);

      return claims.purpose === PURPOSE ? claims.sub : null;
    } catch {
      return null;
    }
  }
}
