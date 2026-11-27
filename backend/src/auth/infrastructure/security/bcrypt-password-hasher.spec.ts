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

  it('falls back to the standard cost when no cost is configured', async () => {
    const defaultHasher = new BcryptPasswordHasher({
      get: () => undefined,
    } as unknown as ConfigService);

    await expect(defaultHasher.hash('senhaSegura123')).resolves.toMatch(/^\$2[aby]\$12\$/);
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
    const decoyHasher = new BcryptPasswordHasher(configWithRounds(4));
    await expect(decoyHasher.compareWithDecoy('qualquer')).resolves.toBeUndefined();
    await expect(decoyHasher.compareWithDecoy('outra senha')).resolves.toBeUndefined();
  });
});
