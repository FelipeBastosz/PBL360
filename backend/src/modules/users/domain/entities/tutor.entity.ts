import { UserType } from '../enums/user-type.enum';
import { type UserProps, User } from './user.entity';

export type TutorProps = Omit<UserProps, 'tipo'>;

export class Tutor extends User {
  constructor(props: TutorProps) {
    super({ ...props, tipo: UserType.TUTOR });
  }
}
