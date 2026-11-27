import { HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { AccountPendingVerificationError } from '../../application/errors/account-pending-verification.error';
import {
  PENDING_VERIFICATION_MESSAGE,
  PENDING_VERIFICATION_REASON,
} from '../../application/dtos/pending-verification-response.dto';
import {
  PendingVerificationFilter,
  toPendingVerificationResponse,
} from './pending-verification.filter';

describe('PendingVerificationFilter', () => {
  const error = new AccountPendingVerificationError('user-1', 'ana@example.com');

  it('maps the domain error to the public response shape', () => {
    expect(toPendingVerificationResponse(error)).toEqual({
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      message: PENDING_VERIFICATION_MESSAGE,
      motivo: PENDING_VERIFICATION_REASON,
      usuarioId: 'user-1',
      email: 'ana@example.com',
    });
  });

  it('writes the forbidden response to the HTTP response', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const getResponse = jest.fn().mockReturnValue({ status });
    const host = {
      switchToHttp: jest.fn().mockReturnValue({ getResponse }),
    } as unknown as ArgumentsHost;

    new PendingVerificationFilter().catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith(toPendingVerificationResponse(error));
  });
});
