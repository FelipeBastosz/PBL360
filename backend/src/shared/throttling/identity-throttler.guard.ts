import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface ThrottledRequest {
  ip?: string;
  body?: { email?: unknown; usuarioId?: unknown };
}

const identityOf = (body: ThrottledRequest['body']): string => {
  const identity = body?.email ?? body?.usuarioId;

  return typeof identity === 'string' ? identity.trim().toLowerCase() : '';
};

@Injectable()
export class IdentityThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    const { ip, body } = request as ThrottledRequest;

    return Promise.resolve(`${ip ?? 'unknown'}|${identityOf(body)}`);
  }
}
