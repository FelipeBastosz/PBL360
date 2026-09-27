import { registerAs } from '@nestjs/config';

const DEFAULT_CORS_ORIGIN = 'http://localhost:5173';

const toInteger = (value: string | undefined, fallback: number): number =>
  parseInt(value ?? String(fallback), 10);

const parseTrustProxy = (value: string | undefined): boolean | number | string => {
  if (value === undefined || value === 'false') return false;
  if (value === 'true') return true;

  return /^\d+$/.test(value) ? parseInt(value, 10) : value;
};

export const readDatabaseEnv = (env: NodeJS.ProcessEnv = process.env) => ({
  host: env.DB_HOST ?? 'localhost',
  port: toInteger(env.DB_PORT, 5432),
  username: env.DB_USERNAME ?? 'pbl360',
  password: env.DB_PASSWORD ?? 'pbl360',
  database: env.DB_NAME ?? 'pbl360',
  synchronize: env.NODE_ENV !== 'production' && env.DB_SYNCHRONIZE === 'true',
  logging: env.DB_LOGGING === 'true',
});

export const appConfig = registerAs('app', () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: toInteger(process.env.PORT, 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigin: (process.env.CORS_ORIGIN ?? DEFAULT_CORS_ORIGIN).split(',').map((o) => o.trim()),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
}));

export const databaseConfig = registerAs('database', () => readDatabaseEnv());

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  bcryptRounds: toInteger(process.env.BCRYPT_ROUNDS, 12),
}));

export const mailConfig = registerAs('mail', () => ({
  smtpUser: process.env.SMTP_USER ?? '',
  smtpPass: process.env.SMTP_PASS ?? '',
}));
