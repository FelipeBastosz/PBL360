import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
import { randomUUID } from 'node:crypto';

export interface NewEmailVerificationCode {
  userId: string;
  email: string;
  code: string;
  expiresInMinutes: number;
}

@Entity('email_verification_codes')
export class EmailVerificationCode {
  @PrimaryColumn('uuid')
  id!: string;

  @Index('IDX_email_verification_codes_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Index('IDX_email_verification_codes_email')
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

  static issue(props: NewEmailVerificationCode): EmailVerificationCode {
    const now = new Date();
    const entity = new EmailVerificationCode();
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
