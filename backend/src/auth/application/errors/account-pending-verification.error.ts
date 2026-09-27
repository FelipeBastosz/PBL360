import { ForbiddenError } from '@/shared/errors/application.error';

export class AccountPendingVerificationError extends ForbiddenError {
  constructor(
    readonly userId: string,
    readonly email: string,
  ) {
    super('Account is pending e-mail verification.');
  }
}
