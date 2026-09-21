import type { PasswordResetCode } from '../entities/password-reset-code.entity';

export interface PasswordResetCodeRepository {
  save(code: PasswordResetCode): Promise<void>;

  findPendingByUserId(userId: string): Promise<PasswordResetCode | null>;

  invalidatePendingFor(userId: string): Promise<void>;

  markAsUsed(id: string): Promise<void>;
}

export const PASSWORD_RESET_CODE_REPOSITORY = Symbol('PasswordResetCodeRepository');
