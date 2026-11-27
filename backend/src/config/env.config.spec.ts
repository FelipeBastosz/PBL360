import { appConfig, authConfig, databaseConfig, mailConfig, readDatabaseEnv } from './env.config';

const withEnvironment = <T>(values: Record<string, string | undefined>, run: () => T): T => {
  const original = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    original.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return run();
  } finally {
    for (const [key, value] of original) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

describe('environment config factories', () => {
  it('uses database defaults and parses supplied numeric and boolean values', () => {
    expect(readDatabaseEnv({})).toEqual({
      host: 'localhost',
      port: 5432,
      username: 'pbl360',
      password: 'pbl360',
      database: 'pbl360',
      synchronize: false,
      logging: false,
    });
    expect(
      readDatabaseEnv({
        DB_HOST: 'db',
        DB_PORT: '5544',
        DB_USERNAME: 'test-user',
        DB_PASSWORD: 'secret',
        DB_NAME: 'pbl360_test',
        NODE_ENV: 'development',
        DB_SYNCHRONIZE: 'true',
        DB_LOGGING: 'true',
      }),
    ).toEqual({
      host: 'db',
      port: 5544,
      username: 'test-user',
      password: 'secret',
      database: 'pbl360_test',
      synchronize: true,
      logging: true,
    });
  });

  it('never enables schema synchronization in production', () => {
    expect(readDatabaseEnv({ NODE_ENV: 'production', DB_SYNCHRONIZE: 'true' }).synchronize).toBe(
      false,
    );
  });

  it('provides app defaults and parses proxy and CORS settings', () => {
    expect(
      withEnvironment(
        {
          NODE_ENV: undefined,
          PORT: undefined,
          API_PREFIX: undefined,
          CORS_ORIGIN: undefined,
          TRUST_PROXY: undefined,
        },
        () => appConfig(),
      ),
    ).toEqual({
      env: 'development',
      port: 3000,
      apiPrefix: 'api',
      corsOrigin: ['http://localhost:5173'],
      trustProxy: false,
    });
    expect(
      withEnvironment(
        {
          NODE_ENV: 'production',
          PORT: '3010',
          API_PREFIX: 'v2',
          CORS_ORIGIN: 'https://app.test, https://admin.test ',
          TRUST_PROXY: '2',
        },
        () => appConfig(),
      ),
    ).toEqual({
      env: 'production',
      port: 3010,
      apiPrefix: 'v2',
      corsOrigin: ['https://app.test', 'https://admin.test'],
      trustProxy: 2,
    });
  });

  it('supports explicit boolean and named proxy values', () => {
    for (const [trustProxy, expected] of [
      ['false', false],
      ['true', true],
      ['loopback', 'loopback'],
    ] as const) {
      expect(withEnvironment({ TRUST_PROXY: trustProxy }, () => appConfig().trustProxy)).toBe(
        expected,
      );
    }
  });

  it('provides database, authentication and mail config namespaces', () => {
    withEnvironment(
      {
        DB_NAME: undefined,
        JWT_SECRET: 'test-secret',
        JWT_EXPIRES_IN: '2h',
        BCRYPT_ROUNDS: '10',
        SMTP_USER: 'mailer',
        SMTP_PASS: 'mail-secret',
        GMAIL_CLIENT_ID: 'gmail-client',
        GMAIL_CLIENT_SECRET: 'gmail-secret',
        GMAIL_REFRESH_TOKEN: 'gmail-refresh',
      },
      () => {
        expect(databaseConfig().database).toBe('pbl360');
        expect(authConfig()).toEqual({
          jwtSecret: 'test-secret',
          jwtExpiresIn: '2h',
          bcryptRounds: 10,
        });
        expect(mailConfig()).toEqual({
          smtpUser: 'mailer',
          smtpPass: 'mail-secret',
          gmailClientId: 'gmail-client',
          gmailClientSecret: 'gmail-secret',
          gmailRefreshToken: 'gmail-refresh',
        });
      },
    );
  });

  it('uses the default token duration, password cost and empty mail settings', () => {
    withEnvironment(
      {
        JWT_SECRET: undefined,
        JWT_EXPIRES_IN: undefined,
        BCRYPT_ROUNDS: undefined,
        SMTP_USER: undefined,
        SMTP_PASS: undefined,
        GMAIL_CLIENT_ID: undefined,
        GMAIL_CLIENT_SECRET: undefined,
        GMAIL_REFRESH_TOKEN: undefined,
      },
      () => {
        expect(authConfig()).toEqual({
          jwtSecret: undefined,
          jwtExpiresIn: '1d',
          bcryptRounds: 12,
        });
        expect(mailConfig()).toEqual({
          smtpUser: '',
          smtpPass: '',
          gmailClientId: '',
          gmailClientSecret: '',
          gmailRefreshToken: '',
        });
      },
    );
  });
});
