import { HttpException, type ExecutionContext } from '@nestjs/common';
import { RoomEntryThrottlerGuard } from './room-entry-throttler.guard';

class TestableRoomEntryGuard extends RoomEntryThrottlerGuard {
  key(context: ExecutionContext, tracker: string, name: string): string {
    return this.generateKey(context, tracker, name);
  }
  reject(context: ExecutionContext): void {
    void this.throwThrottlingException(context);
  }
}

describe('RoomEntryThrottlerGuard', () => {
  it('namespaced throttling keys by room-entry and tracker', () => {
    const guard = Object.create(TestableRoomEntryGuard.prototype) as TestableRoomEntryGuard;
    expect(guard.key({} as ExecutionContext, 'ip|identity', 'default')).toBe(
      'room-entry-default-ip|identity',
    );
  });

  it('throws the room entry rate limit response', () => {
    const guard = Object.create(TestableRoomEntryGuard.prototype) as TestableRoomEntryGuard;
    let thrown: unknown;
    try {
      guard.reject({} as ExecutionContext);
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getResponse()).toEqual({
      statusCode: 429,
      message: 'Muitas tentativas de ingresso. Aguarde um minuto e tente novamente.',
      error: 'Too Many Requests',
    });
  });
});
