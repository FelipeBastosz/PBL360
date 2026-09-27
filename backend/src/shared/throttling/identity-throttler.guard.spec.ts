import { IdentityThrottlerGuard } from './identity-throttler.guard';

class ExposedGuard extends IdentityThrottlerGuard {
  trackerOf(request: Record<string, unknown>): Promise<string> {
    return this.getTracker(request);
  }
}

describe('IdentityThrottlerGuard', () => {
  const guard = Object.create(ExposedGuard.prototype) as ExposedGuard;

  it('limits by address and e-mail together', async () => {
    await expect(
      guard.trackerOf({ ip: '10.0.0.1', body: { email: ' Ana@Discente.uefs.br ' } }),
    ).resolves.toBe('10.0.0.1|ana@discente.uefs.br');
  });

  it('falls back to the user id sent by the verification step', async () => {
    await expect(guard.trackerOf({ ip: '10.0.0.1', body: { usuarioId: 'abc' } })).resolves.toBe(
      '10.0.0.1|abc',
    );
  });

  it('keeps shared addresses apart per account', async () => {
    const [ana, joao] = await Promise.all([
      guard.trackerOf({ ip: '10.0.0.1', body: { email: 'ana@discente.uefs.br' } }),
      guard.trackerOf({ ip: '10.0.0.1', body: { email: 'joao@discente.uefs.br' } }),
    ]);

    expect(ana).not.toBe(joao);
  });
});
