import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { randomBytes } from 'node:crypto';
import type { PasswordHasher } from '../../domain/services/password-hasher';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds: number;
  private decoyHash?: Promise<string>;

  constructor(config: ConfigService) {
    this.rounds = config.get<number>('auth.bcryptRounds') ?? 12;
  }

  async hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, this.rounds);
  }

  async matches(plainPassword: string, passwordHash: string): Promise<boolean> {
    return compare(plainPassword, passwordHash);
  }

  async compareWithDecoy(plainPassword: string): Promise<void> {
    this.decoyHash ??= hash(randomBytes(16).toString('hex'), this.rounds);

    await compare(plainPassword, await this.decoyHash);
  }
}
