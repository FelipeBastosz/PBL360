import type { ThrottlerOptions } from '@nestjs/throttler';

export const AUTH_THROTTLER = 'auth';

const FIFTEEN_MINUTES = 900_000;

export const THROTTLERS: ThrottlerOptions[] = [
  { name: AUTH_THROTTLER, ttl: FIFTEEN_MINUTES, limit: 10 },
];

export const STRICT_AUTH_LIMIT = { [AUTH_THROTTLER]: { limit: 5, ttl: FIFTEEN_MINUTES } };
