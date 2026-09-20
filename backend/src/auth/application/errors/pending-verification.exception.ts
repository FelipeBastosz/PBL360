import { ForbiddenException, HttpStatus } from '@nestjs/common';
import type { User } from '@/users/domain/entities/user.entity';

export const PENDING_VERIFICATION_REASON = 'CONTA_NAO_VERIFICADA';

export const PENDING_VERIFICATION_MESSAGE =
  'Confirme o código enviado para o seu e-mail institucional para ativar a conta.';

export class PendingVerificationException extends ForbiddenException {
  constructor(user: User) {
    super({
      statusCode: HttpStatus.FORBIDDEN,
      error: 'Forbidden',
      message: PENDING_VERIFICATION_MESSAGE,
      motivo: PENDING_VERIFICATION_REASON,
      usuarioId: user.id,
      email: user.email,
    });
  }
}
