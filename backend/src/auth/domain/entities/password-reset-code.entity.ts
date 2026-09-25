import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { OneTimeCode, type NewOneTimeCode } from './one-time-code';

@Entity('password_reset_codes')
export class PasswordResetCode extends OneTimeCode {
  @Index('IDX_password_reset_codes_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_password_reset_codes_user',
  })
  user!: User;

  @Column({ type: 'varchar', length: 160 })
  email!: string;

  static issue(props: NewOneTimeCode): PasswordResetCode {
    return new PasswordResetCode().fill(props);
  }
}
