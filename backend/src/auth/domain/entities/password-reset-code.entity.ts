import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { randomUUID } from 'node:crypto';
import { User } from '@/users/domain/entities/user.entity';

export interface NewPasswordResetCode {
  userId: string;
  email: string;
  code: string;
  expiresInMinutes: number;
}

@Entity('password_reset_codes')
export class PasswordResetCode {
  @PrimaryColumn('uuid')
  id!: string;

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

  @Column({ type: 'varchar', length: 6 })
  code!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt?: Date | null;

  constructor() {}

  static issue(props: NewPasswordResetCode): PasswordResetCode {
    const now = new Date();
    const entity = new PasswordResetCode();
    entity.id = randomUUID();
    entity.userId = props.userId;
    entity.email = props.email;
    entity.code = props.code;
    entity.expiresAt = new Date(now.getTime() + props.expiresInMinutes * 60 * 1000);
    entity.createdAt = now;
    entity.usedAt = null;

    return entity;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isUsed(): boolean {
    return this.usedAt !== null && this.usedAt !== undefined;
  }

  isValid(inputCode: string): boolean {
    return this.code === inputCode && !this.isExpired() && !this.isUsed();
  }
}
