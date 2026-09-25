import type { PasswordResetCode } from '../entities/password-reset-code.entity';
import type { OneTimeCodeRepository } from './one-time-code.repository';

export type PasswordResetCodeRepository = OneTimeCodeRepository<PasswordResetCode>;

export const PASSWORD_RESET_CODE_REPOSITORY = Symbol('PasswordResetCodeRepository');
