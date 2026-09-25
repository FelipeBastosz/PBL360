import type { UserType } from '@/users/domain/enums/user-type.enum';

export const ACCESS_TOKEN_AUDIENCE = 'pbl360:access';

export const PASSWORD_RESET_AUDIENCE = 'pbl360:password-reset';

export interface AccessTokenClaims {
  sub: string;
  email: string;
  type: UserType;
  ver: number;
}
