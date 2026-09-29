import type { ThrottlerOptions } from '@nestjs/throttler';

export const AUTH_THROTTLER = 'auth';
export const ROOM_ENTRY_THROTTLER = 'room-entry';

const FIFTEEN_MINUTES = 900_000;
const ONE_MINUTE = 60_000;

export const THROTTLERS: ThrottlerOptions[] = [
  { name: AUTH_THROTTLER, ttl: FIFTEEN_MINUTES, limit: 10 },
  { name: ROOM_ENTRY_THROTTLER, ttl: ONE_MINUTE, limit: 5 },
];

export const STRICT_AUTH_LIMIT = { [AUTH_THROTTLER]: { limit: 5, ttl: FIFTEEN_MINUTES } };
export const ROOM_ENTRY_LIMIT = { [ROOM_ENTRY_THROTTLER]: { limit: 5, ttl: ONE_MINUTE } };
