import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { Column, CreateDateColumn, PrimaryColumn } from 'typeorm';

export const MAX_CODE_ATTEMPTS = 5;

export interface NewOneTimeCode {
  userId: string;
  email: string;
  code: string;
  expiresInMinutes: number;
}

export const hashCode = (code: string): string => createHash('sha256').update(code).digest('hex');

export abstract class OneTimeCode {
  @PrimaryColumn('uuid')
  id!: string;

  userId!: string;

  email!: string;

  @Column({ name: 'code_hash', type: 'varchar', length: 64 })
  codeHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  protected fill(props: NewOneTimeCode): this {
    const now = new Date();

    this.id = randomUUID();
    this.userId = props.userId;
    this.email = props.email;
    this.codeHash = hashCode(props.code);
    this.expiresAt = new Date(now.getTime() + props.expiresInMinutes * 60_000);
    this.createdAt = now;
    this.usedAt = null;
    this.attempts = 0;

    return this;
  }

  isUsable(now: Date = new Date()): boolean {
    return this.usedAt === null && now < this.expiresAt && this.attempts < MAX_CODE_ATTEMPTS;
  }

  matches(code: string): boolean {
    const expected = Buffer.from(this.codeHash, 'hex');
    const received = Buffer.from(hashCode(code), 'hex');

    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}
