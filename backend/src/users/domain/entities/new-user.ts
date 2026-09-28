import type { UserType } from '../enums/user-type.enum';
import type { UserPhoto } from './user-photo.entity';

export interface NewUser {
  name: string;
  email: string;
  passwordHash: string;
  type: UserType;
  registrationNumber?: string | null;
  photo?: UserPhoto | null;
}
