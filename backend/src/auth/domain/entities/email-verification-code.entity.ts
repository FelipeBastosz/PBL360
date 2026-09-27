import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '@/users/domain/entities/user.entity';
import { OneTimeCode, type NewOneTimeCode } from './one-time-code';

@Entity('email_verification_codes')
export class EmailVerificationCode extends OneTimeCode {
  @Index('IDX_email_verification_codes_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  override userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_email_verification_codes_user',
  })
  user!: User;

  @Index('IDX_email_verification_codes_email')
  @Column({ type: 'varchar', length: 160 })
  override email!: string;

  static issue(props: NewOneTimeCode): EmailVerificationCode {
    return new EmailVerificationCode().fill(props);
  }
}
