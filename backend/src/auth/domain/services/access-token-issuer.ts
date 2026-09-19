import type { User } from '@/users/domain/entities/user.entity';
import type { UserType } from '@/users/domain/enums/user-type.enum';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  type: UserType;
}

export interface AccessToken {
  value: string;
  expiresAt: Date;
}

export interface AccessTokenIssuer {
  issueFor(user: User): Promise<AccessToken>;
}

export const ACCESS_TOKEN_ISSUER = Symbol('AccessTokenIssuer');
