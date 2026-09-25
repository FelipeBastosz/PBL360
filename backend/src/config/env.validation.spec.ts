import { JWT_SECRET_PLACEHOLDER, validateDatabaseEnv, validateEnv } from './env.validation';

const STRONG_SECRET = 'a'.repeat(32);

const productionEnv = (overrides: Record<string, string> = {}): Record<string, string> => ({
  NODE_ENV: 'production',
  JWT_SECRET: STRONG_SECRET,
  DB_HOST: 'db',
  DB_USERNAME: 'app',
  DB_PASSWORD: 'secret',
  DB_NAME: 'pbl360',
  CORS_ORIGIN: 'https://pbl360.uefs.br',
  SMTP_USER: 'mailer',
  SMTP_PASS: 'secret',
  ...overrides,
});

describe('validateEnv', () => {
  it('accepts a development environment with only the JWT secret', () => {
    const env = { JWT_SECRET: 'dev-secret' };

    expect(validateEnv(env)).toBe(env);
  });

  it('rejects a missing JWT secret', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' })).toThrow('JWT_SECRET is required.');
  });

  it('rejects numbers that are not integers', () => {
    expect(() => validateEnv({ JWT_SECRET: 'x', BCRYPT_ROUNDS: 'doze' })).toThrow(
      'BCRYPT_ROUNDS must be a positive integer.',
    );
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ JWT_SECRET: 'x', NODE_ENV: 'prod' })).toThrow('NODE_ENV');
  });

  it('accepts a complete production environment', () => {
    expect(() => validateEnv(productionEnv())).not.toThrow();
  });

  it.each([JWT_SECRET_PLACEHOLDER, 'short-secret'])(
    'rejects the weak secret "%s" in production',
    (secret) => {
      expect(() => validateEnv(productionEnv({ JWT_SECRET: secret }))).toThrow(
        'JWT_SECRET must have at least 32 characters in production.',
      );
    },
  );

  it('requires database, CORS and SMTP settings in production', () => {
    expect(() => validateEnv(productionEnv({ CORS_ORIGIN: '', DB_PASSWORD: '' }))).toThrow(
      /CORS_ORIGIN is required in production[\s\S]*DB_PASSWORD|DB_PASSWORD[\s\S]*CORS_ORIGIN/,
    );
  });

  it('refuses schema synchronization in production', () => {
    expect(() => validateEnv(productionEnv({ DB_SYNCHRONIZE: 'true' }))).toThrow(
      'DB_SYNCHRONIZE cannot be enabled in production.',
    );
  });
});

describe('validateDatabaseEnv', () => {
  it('does not need the JWT secret to run migrations', () => {
    expect(() => validateDatabaseEnv({ DB_NAME: 'pbl360_test' })).not.toThrow();
  });

  it('requires the database settings in production', () => {
    expect(() => validateDatabaseEnv({ NODE_ENV: 'production', DB_HOST: 'db' })).toThrow(
      'DB_USERNAME is required in production.',
    );
  });
});
