import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';
import type { EmailVerificationCodeRepository } from '../../domain/repositories/email-verification-code.repository';

@Injectable()
export class TypeOrmEmailVerificationCodeRepository implements EmailVerificationCodeRepository {
  constructor(
    @InjectRepository(EmailVerificationCode)
    private readonly repository: Repository<EmailVerificationCode>,
  ) {}

  async save(code: EmailVerificationCode): Promise<void> {
    await this.repository.save(code);
  }

  async findPendingByEmail(email: string): Promise<EmailVerificationCode | null> {
    return this.repository.findOne({
      where: { email },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsUsed(id: string): Promise<void> {
    await this.repository.update(id, { usedAt: new Date() });
  }
}
