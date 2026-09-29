import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface ThrottledRequest {
  ip?: string;
  body?: { email?: unknown; usuarioId?: unknown };
  user?: { sub?: unknown };
}

const identityOf = (body: ThrottledRequest['body']): string => {
  const identity = body?.email ?? body?.usuarioId;

  return typeof identity === 'string' ? identity.trim().toLowerCase() : '';
};

@Injectable()
export class IdentityThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: Record<string, unknown>): Promise<string> {
    const { ip, body, user } = request as ThrottledRequest;

    const userId = typeof user?.sub === 'string' ? user.sub : '';

    const identity = identityOf(body);
    const tracker = `${ip ?? 'unknown'}|${identity}`;

    return Promise.resolve(userId ? `${tracker}|${userId}` : tracker);
  }
}
