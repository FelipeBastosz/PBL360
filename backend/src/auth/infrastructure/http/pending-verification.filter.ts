import { ArgumentsHost, Catch, HttpStatus, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { AccountPendingVerificationError } from '../../application/errors/account-pending-verification.error';
import {
  PENDING_VERIFICATION_MESSAGE,
  PENDING_VERIFICATION_REASON,
  type PendingVerificationResponseDto,
} from '../../application/dtos/pending-verification-response.dto';

export const toPendingVerificationResponse = (
  error: AccountPendingVerificationError,
): PendingVerificationResponseDto => ({
  statusCode: HttpStatus.FORBIDDEN,
  error: 'Forbidden',
  message: PENDING_VERIFICATION_MESSAGE,
  motivo: PENDING_VERIFICATION_REASON,
  usuarioId: error.userId,
  email: error.email,
});

@Catch(AccountPendingVerificationError)
export class PendingVerificationFilter implements ExceptionFilter<AccountPendingVerificationError> {
  catch(error: AccountPendingVerificationError, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.FORBIDDEN)
      .json(toPendingVerificationResponse(error));
  }
}
