import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';
import { PgOneTimeCodeRepository } from './pg-one-time-code.repository';

@Injectable()
export class PgEmailVerificationCodeRepository extends PgOneTimeCodeRepository<EmailVerificationCode> {
  constructor(
    @InjectRepository(EmailVerificationCode) repository: Repository<EmailVerificationCode>,
  ) {
    super(repository, 'email_verification_codes');
  }
}
