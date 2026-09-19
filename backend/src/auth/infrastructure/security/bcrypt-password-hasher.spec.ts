import type { ConfigService } from '@nestjs/config';
import { BcryptPasswordHasher } from './bcrypt-password-hasher';

describe('BcryptPasswordHasher', () => {
  let hasher: BcryptPasswordHasher;
  let configServiceMock: jest.Mocked<Pick<ConfigService, 'get'>>;

  beforeEach(() => {
    configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'BCRYPT_SALT_ROUNDS' || key === 'SECURITY_BCRYPT_SALT_ROUNDS') {
          return 10;
        }
        return null;
      }),
    };

    hasher = new BcryptPasswordHasher(configServiceMock as unknown as ConfigService);
  });

  describe('hash', () => {
    it('should generate a hashed string different from plain text', async () => {
      const plain = 'senhaSegura123';
      const hash = await hasher.hash(plain);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(plain);
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should generate distinct hashes for the same plain password', async () => {
      const plain = 'senhaSegura123';
      const hash1 = await hasher.hash(plain);
      const hash2 = await hasher.hash(plain);

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('matches', () => {
    it('should return true when plain password matches hash', async () => {
      const plain = 'senhaSegura123';
      const hash = await hasher.hash(plain);

      const isValid = await hasher.matches(plain, hash);

      expect(isValid).toBe(true);
    });

    it('should return false when plain password does not match hash', async () => {
      const plain = 'senhaSegura123';
      const hash = await hasher.hash(plain);

      const isValid = await hasher.matches('senhaIncorreta', hash);

      expect(isValid).toBe(false);
    });
  });
});
