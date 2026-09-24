import type { UserType } from '@/users/domain/enums/user-type.enum';

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  type: UserType;
}
