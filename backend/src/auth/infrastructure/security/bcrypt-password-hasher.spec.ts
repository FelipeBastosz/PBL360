import type { ConfigService } from '@nestjs/config';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

const configWithRounds = (rounds: number): ConfigService =>
  ({
    get: (key: string) => (key === 'auth.bcryptRounds' ? rounds : undefined),
  }) as unknown as ConfigService;

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher(configWithRounds(4));

  it('uses the configured cost', async () => {
    await expect(hasher.hash('senhaSegura123')).resolves.toMatch(/^\$2[aby]\$04\$/);
  });

  it('salts every hash', async () => {
    const [first, second] = await Promise.all([hasher.hash('igual'), hasher.hash('igual')]);

    expect(first).not.toBe(second);
  });

  it('matches only the original password', async () => {
    const hash = await hasher.hash('senhaSegura123');

    await expect(hasher.matches('senhaSegura123', hash)).resolves.toBe(true);
    await expect(hasher.matches('senhaIncorreta', hash)).resolves.toBe(false);
  });

  it('compares against a decoy without failing', async () => {
    await expect(hasher.compareWithDecoy('qualquer')).resolves.toBeUndefined();
  });
});
