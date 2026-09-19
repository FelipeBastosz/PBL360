import { UserType } from '../enums/user-type.enum';
import { User, type UserProps } from './user.entity';

export type StudentProps = Omit<UserProps, 'tipo'>;

export class Student extends User {
  constructor(props: StudentProps) {
    super({ ...props, tipo: UserType.ALUNO });
  }
}
