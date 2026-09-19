import type { User } from '@/users/domain/entities/user.entity';
import type { AccessToken } from '../domain/services/access-token-issuer';

export interface AuthenticatedSession {
  user: User;
  accessToken: AccessToken;
}
