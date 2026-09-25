import type { EmailVerificationCode } from '../entities/email-verification-code.entity';
import type { OneTimeCodeRepository } from './one-time-code.repository';

export type EmailVerificationCodeRepository = OneTimeCodeRepository<EmailVerificationCode>;

export const EMAIL_VERIFICATION_CODE_REPOSITORY = Symbol('EmailVerificationCodeRepository');
