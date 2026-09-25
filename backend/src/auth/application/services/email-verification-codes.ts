import { Inject, Injectable } from '@nestjs/common';
import { EmailVerificationCode } from '../../domain/entities/email-verification-code.entity';
import type { NewOneTimeCode } from '../../domain/entities/one-time-code';
import {
  EMAIL_VERIFICATION_CODE_REPOSITORY,
  type EmailVerificationCodeRepository,
} from '../../domain/repositories/email-verification-code.repository';
import type { CodeSender } from '../../domain/services/code-sender';
import { EMAIL_VERIFICATION_SENDER } from '../../domain/services/email-verification-sender';
import { OneTimeCodeService } from './one-time-code.service';

@Injectable()
export class EmailVerificationCodes extends OneTimeCodeService<EmailVerificationCode> {
  constructor(
    @Inject(EMAIL_VERIFICATION_CODE_REPOSITORY) codes: EmailVerificationCodeRepository,
    @Inject(EMAIL_VERIFICATION_SENDER) sender: CodeSender,
  ) {
    super(codes, sender);
  }

  protected build(props: NewOneTimeCode): EmailVerificationCode {
    return EmailVerificationCode.issue(props);
  }
}
