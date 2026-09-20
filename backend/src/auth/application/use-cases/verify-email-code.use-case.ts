import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  EMAIL_VERIFICATION_CODE_REPOSITORY,
  type EmailVerificationCodeRepository,
} from '../../domain/repositories/email-verification-code.repository';

export interface VerifyEmailCodeInput {
  email: string;
  code: string;
}

@Injectable()
export class VerifyEmailCodeUseCase {
  constructor(
    @Inject(EMAIL_VERIFICATION_CODE_REPOSITORY)
    private readonly codes: EmailVerificationCodeRepository,
  ) {}

  async execute(input: VerifyEmailCodeInput): Promise<void> {
    const email = input.email.trim().toLowerCase();
    const pendingCode = await this.codes.findPendingByEmail(email);

    if (!pendingCode || !pendingCode.isValid(input.code)) {
      throw new BadRequestException('Código de verificação inválido ou expirado.');
    }

    await this.codes.markAsUsed(pendingCode.id);
  }
}
