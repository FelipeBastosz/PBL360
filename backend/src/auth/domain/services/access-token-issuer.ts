import type { User } from '@/users/domain/entities/user.entity';

export interface AccessToken {
  value: string;
  expiresAt: Date;
}

export interface AccessTokenIssuer {
  issueFor(user: User): Promise<AccessToken>;
}

export const ACCESS_TOKEN_ISSUER = Symbol('AccessTokenIssuer');
