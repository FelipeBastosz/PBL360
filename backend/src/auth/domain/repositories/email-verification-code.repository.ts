import type { EmailVerificationCode } from '../entities/email-verification-code.entity';

export interface EmailVerificationCodeRepository {
  save(code: EmailVerificationCode): Promise<void>;

  findPendingByEmail(email: string): Promise<EmailVerificationCode | null>;

  markAsUsed(id: string): Promise<void>;
}

export const EMAIL_VERIFICATION_CODE_REPOSITORY = Symbol('EmailVerificationCodeRepository');
