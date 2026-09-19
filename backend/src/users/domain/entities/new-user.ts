import type { UserType } from '../enums/user-type.enum';

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  type: UserType;
  registrationNumber?: string | null;
  photoUrl?: string | null;
}
