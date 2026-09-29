import { HttpException, Injectable, type ExecutionContext } from '@nestjs/common';
import { IdentityThrottlerGuard } from './identity-throttler.guard';

@Injectable()
export class RoomEntryThrottlerGuard extends IdentityThrottlerGuard {
  protected override generateKey(
    _context: ExecutionContext,
    tracker: string,
    throttlerName: string,
  ): string {
    return `room-entry-${throttlerName}-${tracker}`;
  }

  protected override throwThrottlingException(_context: ExecutionContext): Promise<void> {
    throw new HttpException(
      {
        statusCode: 429,
        message: 'Muitas tentativas de ingresso. Aguarde um minuto e tente novamente.',
        error: 'Too Many Requests',
      },
      429,
    );
  }
}
