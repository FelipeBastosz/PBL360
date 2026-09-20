import type { EmailVerificationCode } from '../entities/email-verification-code.entity';

export interface EmailVerificationCodeRepository {
  save(code: EmailVerificationCode): Promise<void>;

  findPendingByUserId(userId: string): Promise<EmailVerificationCode | null>;

  invalidatePendingFor(userId: string): Promise<void>;

  markAsUsed(id: string): Promise<void>;
}

export const EMAIL_VERIFICATION_CODE_REPOSITORY = Symbol('EmailVerificationCodeRepository');
