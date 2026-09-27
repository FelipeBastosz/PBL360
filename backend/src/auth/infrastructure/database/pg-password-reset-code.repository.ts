import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetCode } from '../../domain/entities/password-reset-code.entity';
import { PgOneTimeCodeRepository } from './pg-one-time-code.repository';

@Injectable()
export class PgPasswordResetCodeRepository extends PgOneTimeCodeRepository<PasswordResetCode> {
  constructor(@InjectRepository(PasswordResetCode) repository: Repository<PasswordResetCode>) {
    super(repository, 'password_reset_codes');
  }
}
