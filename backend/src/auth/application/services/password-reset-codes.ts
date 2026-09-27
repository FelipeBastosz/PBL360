import { Inject, Injectable } from '@nestjs/common';
import type { NewOneTimeCode } from '../../domain/entities/one-time-code';
import { PasswordResetCode } from '../../domain/entities/password-reset-code.entity';
import {
  PASSWORD_RESET_CODE_REPOSITORY,
  type PasswordResetCodeRepository,
} from '../../domain/repositories/password-reset-code.repository';
import type { CodeSender } from '../../domain/services/code-sender';
import { PASSWORD_RESET_SENDER } from '../../domain/services/password-reset-sender';
import { OneTimeCodeService } from './one-time-code.service';

@Injectable()
export class PasswordResetCodes extends OneTimeCodeService<PasswordResetCode> {
  constructor(
    @Inject(PASSWORD_RESET_CODE_REPOSITORY) codes: PasswordResetCodeRepository,
    @Inject(PASSWORD_RESET_SENDER) sender: CodeSender,
  ) {
    super(codes, sender);
  }

  protected build(props: NewOneTimeCode): PasswordResetCode {
    return PasswordResetCode.issue(props);
  }
}
